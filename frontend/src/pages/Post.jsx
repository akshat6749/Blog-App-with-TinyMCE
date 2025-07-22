import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/config";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

export default function Post() {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    const { slug } = useParams();
    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);

    // Check if current user is the author (handle both Django and Appwrite user ID formats)
    const isAuthor = post && userData ? 
        (post.userId === userData.$id || post.userId === userData.id) : false;

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) {
                navigate("/");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const fetchedPost = await appwriteService.getPost(slug);
                
                if (fetchedPost && fetchedPost !== false) {
                    setPost(fetchedPost);
                } else {
                    setError("Post not found.");
                    // Navigate to home after showing error briefly
                    setTimeout(() => navigate("/"), 2000);
                }
            } catch (err) {
                console.error("Error fetching post:", err);
                
                if (err.message === 'Authentication required') {
                    setError("Please log in to view this post.");
                    setTimeout(() => navigate('/login'), 2000);
                } else if (err.response?.status === 404) {
                    setError("Post not found.");
                    setTimeout(() => navigate("/"), 2000);
                } else if (err.response?.status === 403) {
                    setError("You don't have permission to view this post.");
                    setTimeout(() => navigate("/"), 2000);
                } else if (err.response?.status >= 500) {
                    setError("Server error. Please try again later.");
                } else {
                    setError("Failed to load post. Please check your connection.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug, navigate]);

    // Load featured image when post is available
    useEffect(() => {
        const loadImage = async () => {
            if (!post?.featuredImage) {
                setImageLoading(false);
                return;
            }

            try {
                setImageLoading(true);
                setImageError(false);

                const url = await appwriteService.getFileViewAsync(post.featuredImage);
                
                if (url) {
                    setImageUrl(url);
                } else {
                    setImageError(true);
                }
            } catch (error) {
                console.error("Error loading image:", error);
                setImageError(true);
            } finally {
                setImageLoading(false);
            }
        };

        loadImage();
    }, [post]);

    const deletePost = async () => {
        if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
            return;
        }

        try {
            setDeleting(true);

            // Use slug for Django or $id for backward compatibility
            const postIdentifier = post.slug || post.$id;
            const deleteStatus = await appwriteService.deletePost(postIdentifier);
            
            if (deleteStatus) {
                // Try to delete the featured image
                if (post.featuredImage) {
                    try {
                        await appwriteService.deleteFile(post.featuredImage);
                    } catch (imageDeleteError) {
                        console.warn("Failed to delete featured image:", imageDeleteError);
                        // Continue even if image deletion fails
                    }
                }
                
                // Navigate to home page after successful deletion
                navigate("/");
            } else {
                alert("Failed to delete the post. Please try again.");
            }
        } catch (err) {
            console.error("Error deleting post:", err);
            
            if (err.message === 'Authentication required') {
                alert("Please log in to delete posts.");
                navigate('/login');
            } else if (err.response?.status === 403) {
                alert("You don't have permission to delete this post.");
            } else if (err.response?.status === 404) {
                alert("Post not found. It may have already been deleted.");
                navigate("/");
            } else {
                alert("Failed to delete the post. Please try again.");
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleRetry = () => {
        window.location.reload();
    };

    // Loading state
    if (loading) {
        return (
            <div className="py-8">
                <Container>
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Post</h2>
                            <p className="text-gray-600">Please wait while we fetch the post...</p>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="py-8">
                <Container>
                    <div className="flex flex-col justify-center items-center min-h-[400px] text-center">
                        <div className="mb-6">
                            <svg 
                                className="w-16 h-16 text-red-400 mx-auto mb-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Unable to Load Post
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-md">
                            {error}
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={handleRetry}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={() => navigate('/')}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Success state - render the post
    return post ? (
        <div className="py-8">
            <Container>
                {/* Featured Image Section */}
                <div className="w-full flex justify-center mb-8 relative border rounded-xl p-2">
                    {imageLoading ? (
                        <div className="w-full h-64 bg-gray-300 rounded-xl flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                        </div>
                    ) : imageError || !imageUrl ? (
                        <div className="w-full h-64 bg-gray-300 rounded-xl flex items-center justify-center">
                            <svg 
                                className="w-16 h-16 text-gray-500" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                />
                            </svg>
                        </div>
                    ) : (
                        <img
                            src={imageUrl}
                            alt={post.title}
                            className="rounded-xl max-w-full h-auto"
                            onError={() => {
                                setImageError(true);
                                setImageUrl(null);
                            }}
                        />
                    )}

                    {/* Author Actions */}
                    {isAuthor && (
                        <div className="absolute right-6 top-6">
                            <Link to={`/edit-post/${post.slug || post.$id}`}>
                                <Button bgColor="bg-green-500" className="mr-3">
                                    Edit
                                </Button>
                            </Link>
                            <Button 
                                bgColor="bg-red-500" 
                                onClick={deletePost}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Post Title */}
                <div className="w-full mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                        {post.title}
                    </h1>
                    
                    {/* Post Meta Information */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                        {post.$createdAt && (
                            <span>
                                Published: {new Date(post.$createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        )}
                        {post.$updatedAt && post.$updatedAt !== post.$createdAt && (
                            <span>
                                Updated: {new Date(post.$updatedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            post.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {post.status}
                        </span>
                    </div>
                </div>

                {/* Post Content */}
                <div className="prose prose-lg max-w-none">
                    <div className="browser-css">
                        {parse(post.content)}
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link 
                        to="/all-posts"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <svg 
                            className="w-4 h-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M15 19l-7-7 7-7" 
                            />
                        </svg>
                        Back to All Posts
                    </Link>
                </div>
            </Container>
        </div>
    ) : null;
}