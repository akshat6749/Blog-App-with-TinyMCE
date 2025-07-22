import conf from '../conf/conf.js';
import axios from 'axios';
import authService from './auth.js';

export class Service {
    constructor() {
        this.baseURL = conf.apiUrl;
        this.setupAxiosDefaults();
    }

    setupAxiosDefaults() {
        // Set default base URL for all requests
        axios.defaults.baseURL = this.baseURL;
        
        // Set default headers
        axios.defaults.headers.common['Content-Type'] = 'application/json';
    }

    // Utility method to generate slug from title
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    // Utility method to ensure user is authenticated
    async ensureAuthenticated() {
        const isValid = await authService.ensureValidToken();
        if (!isValid) {
            throw new Error('Authentication required');
        }
    }

    async createPost({ title, slug, content, featuredImage, status, userId }) {
        try {
            await this.ensureAuthenticated();

            const formData = new FormData();
            formData.append('title', title);
            formData.append('slug', slug || this.generateSlug(title));
            formData.append('content', content);
            formData.append('status', status || 'draft');

            if (featuredImage) {
                // Handle both File objects and file IDs
                if (featuredImage instanceof File) {
                    formData.append('featured_image', featuredImage);
                } else if (typeof featuredImage === 'string') {
                    // If it's a file ID/URL, we might need to handle differently
                    // For now, we'll skip it as Django expects actual file uploads
                    console.log('Featured image as file ID not supported, skipping...');
                }
            }

            const response = await axios.post('/posts/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Transform response to match Appwrite format
            const post = response.data;
            return {
                ...post,
                $id: post.id,
                $createdAt: post.created_at,
                $updatedAt: post.updated_at,
                userId: post.user?.id || userId,
                featuredImage: post.featured_image,
            };
        } catch (error) {
            console.log("Django service :: createPost :: error", error);
            throw error;
        }
    }

    async updatePost(slug, { title, content, featuredImage, status }) {
        try {
            await this.ensureAuthenticated();

            const formData = new FormData();
            if (title) formData.append('title', title);
            if (content) formData.append('content', content);
            if (status) formData.append('status', status);

            if (featuredImage) {
                if (featuredImage instanceof File) {
                    formData.append('featured_image', featuredImage);
                } else if (typeof featuredImage === 'string') {
                    console.log('Featured image as file ID not supported, skipping...');
                }
            }

            const response = await axios.patch(`/posts/${slug}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Transform response to match Appwrite format
            const post = response.data;
            return {
                ...post,
                $id: post.id,
                $createdAt: post.created_at,
                $updatedAt: post.updated_at,
                userId: post.user?.id,
                featuredImage: post.featured_image,
            };
        } catch (error) {
            console.log("Django service :: updatePost :: error", error);
            throw error;
        }
    }

    async deletePost(slug) {
        try {
            await this.ensureAuthenticated();

            await axios.delete(`/posts/${slug}/`);
            return true;
        } catch (error) {
            console.log("Django service :: deletePost :: error", error);
            return false;
        }
    }

    async getPost(slug) {
        try {
            await this.ensureAuthenticated();

            const response = await axios.get(`/posts/get/${slug}/`);
            const post = response.data;

            // Transform response to match Appwrite format
            return {
                ...post,
                $id: post.id,
                $createdAt: post.created_at,
                $updatedAt: post.updated_at,
                userId: post.user?.id,
                featuredImage: post.featured_image,
            };
        } catch (error) {
            console.log("Django service :: getPost :: error", error);
            return false;
        }
    }

    async getPosts(queries = []) {
        try {
            await this.ensureAuthenticated();
    
            // Parse queries to build URL parameters
            let params = new URLSearchParams();
    
            // Handle different query scenarios
            if (queries.length === 0) {
                // Option 1: Don't add any default filter to get ALL posts
                // Remove the default 'active' status if you want all posts
                // params.append('status', 'active');
            } else {
                // Parse Appwrite-style queries
                queries.forEach(query => {
                    try {
                        if (typeof query === 'object' && query !== null) {
                            if (query.method === 'equal' && query.attribute && query.values && query.values.length > 0) {
                                params.append(query.attribute, query.values[0]);
                            }
                            // Add support for other query methods if needed
                            else if (query.method === 'notEqual' && query.attribute && query.values && query.values.length > 0) {
                                params.append(`${query.attribute}__ne`, query.values[0]);
                            }
                        } else if (typeof query === 'string' && query.includes('=')) {
                            // Handle simple string queries
                            const [key, value] = query.split('=');
                            if (key && value) {
                                params.append(key.trim(), value.trim());
                            }
                        }
                    } catch (queryError) {
                        console.warn("Error parsing query:", query, queryError);
                    }
                });
            }
    
            // Build the URL
            const url = params.toString() ? `/posts/list/?${params.toString()}` : '/posts/list/';
            
            const response = await axios.get(url);
            
            // Handle different response formats
            let posts = response.data;
            
            // Check if response has a nested structure
            if (response.data && typeof response.data === 'object') {
                if (response.data.results) {
                    posts = response.data.results; // Django pagination format
                } else if (response.data.data) {
                    posts = response.data.data; // Other nested format
                } else if (Array.isArray(response.data)) {
                    posts = response.data;
                } else {
                    // If it's an object but not an array, it might be a single post
                    posts = [response.data];
                }
            }
    
            // Ensure posts is an array
            if (!Array.isArray(posts)) {
                console.warn("Posts data is not an array:", posts);
                posts = [];
            }
    
            // Transform response to match Appwrite format
            return {
                documents: posts.map(post => {
                    // Handle cases where post might be null or undefined
                    if (!post || typeof post !== 'object') {
                        return null;
                    }
    
                    return {
                        ...post,
                        $id: post.id || post._id || post.$id,
                        $createdAt: post.created_at || post.createdAt || post.$createdAt,
                        $updatedAt: post.updated_at || post.updatedAt || post.$updatedAt,
                        userId: post.user?.id || post.userId || post.user_id,
                        featuredImage: post.featured_image || post.featuredImage,
                    };
                }).filter(post => post !== null), // Remove any null entries
                total: posts.length,
            };
        } catch (error) {
            console.error("Django service :: getPosts :: error", error);
            
            // Log more detailed error information
            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);
            }
            
            // Return a proper error structure instead of false
            return {
                documents: [],
                total: 0,
                error: error.message || 'Unknown error occurred'
            };
        }
    }
    // File upload service
    async uploadFile(file) {
        try {
            await this.ensureAuthenticated();

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/files/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadedFile = response.data;

            // Transform response to match Appwrite format
            return {
                ...uploadedFile,
                $id: uploadedFile.id,
                $createdAt: uploadedFile.uploaded_at,
                name: uploadedFile.original_name,
                sizeOriginal: uploadedFile.file_size,
                mimeType: uploadedFile.content_type,
            };
        } catch (error) {
            console.log("Django service :: uploadFile :: error", error);
            return false;
        }
    }

    async deleteFile(fileId) {
        try {
            await this.ensureAuthenticated();

            await axios.delete(`/files/${fileId}/delete/`);
            return true;
        } catch (error) {
            console.log("Django service :: deleteFile :: error", error);
            return false;
        }
    }

    getFilePreview(fileId) {
        // For Django, we need to make an async call to get the preview URL
        return this.getFilePreviewAsync(fileId);
    }

    async getFilePreviewAsync(fileId) {
        try {
            await this.ensureAuthenticated();

            const response = await axios.get(`/files/${fileId}/preview/`);
            return response.data.url;
        } catch (error) {
            console.log("Django service :: getFilePreview :: error", error);
            return null;
        }
    }

    // Additional utility methods for better compatibility

    // Method to handle Appwrite-style Query objects
    static Query = {
        equal: (attribute, value) => ({
            method: 'equal',
            attribute,
            values: Array.isArray(value) ? value : [value]
        }),
        notEqual: (attribute, value) => ({
            method: 'notEqual',
            attribute,
            values: Array.isArray(value) ? value : [value]
        }),
        lessThan: (attribute, value) => ({
            method: 'lessThan',
            attribute,
            values: [value]
        }),
        greaterThan: (attribute, value) => ({
            method: 'greaterThan',
            attribute,
            values: [value]
        }),
        search: (attribute, value) => ({
            method: 'search',
            attribute,
            values: [value]
        }),
        orderAsc: (attribute) => ({
            method: 'orderAsc',
            attribute
        }),
        orderDesc: (attribute) => ({
            method: 'orderDesc',
            attribute
        }),
        limit: (limit) => ({
            method: 'limit',
            values: [limit]
        })
    };

    // Method to get file download URL
    async getFileDownload(fileId) {
        try {
            await this.ensureAuthenticated();

            const response = await axios.get(`/files/${fileId}/preview/`);
            return response.data.url;
        } catch (error) {
            console.log("Django service :: getFileDownload :: error", error);
            return null;
        }
    }

    // Method to get file view URL (same as preview for Django)
    async getFileView(fileId) {
        return this.getFilePreviewAsync(fileId);
    }
}

// Export Query object for external use
export const Query = Service.Query;

const service = new Service();
export default service;