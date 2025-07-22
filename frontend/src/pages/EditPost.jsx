import React, { useEffect, useState } from 'react';
import { Container, PostForm } from '../components';
import appwriteService from "../appwrite/config";
import { useNavigate, useParams } from 'react-router-dom';

function EditPost() {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { slug } = useParams(); // Get the slug from URL params
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) {
                navigate('/');
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const fetchedPost = await appwriteService.getPost(slug);
                
                if (fetchedPost && fetchedPost !== false) {
                    setPost(fetchedPost);
                } else {
                    // Django service returns false on error
                    setError("Post not found or you don't have permission to edit it.");
                }
            } catch (err) {
                console.error("Error fetching post:", err);
                
                // Handle specific error types
                if (err.message === 'Authentication required') {
                    setError("Please log in to edit posts.");
                    // Optionally redirect to login
                    setTimeout(() => navigate('/login'), 2000);
                } else if (err.response?.status === 404) {
                    setError("Post not found. It may have been deleted or moved.");
                } else if (err.response?.status === 403) {
                    setError("You don't have permission to edit this post.");
                } else if (err.response?.status >= 500) {
                    setError("Server error. Please try again later.");
                } else {
                    setError("Failed to load post. Please check your connection and try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug, navigate]);

    // Retry function for failed requests
    const handleRetry = () => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                setError(null);

                const fetchedPost = await appwriteService.getPost(slug);
                
                if (fetchedPost && fetchedPost !== false) {
                    setPost(fetchedPost);
                } else {
                    setError("Post not found or you don't have permission to edit it.");
                }
            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Failed to load post. Please check your connection and try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    };

    // Loading state
    if (loading) {
        return (
            <div className='py-8'>
                <Container>
                    <div className='flex justify-center items-center min-h-[400px]'>
                        <div className='text-center'>
                            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4'></div>
                            <h2 className='text-xl font-semibold text-gray-700 mb-2'>Loading Post</h2>
                            <p className='text-gray-600'>Please wait while we fetch the post details...</p>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className='py-8'>
                <Container>
                    <div className='flex flex-col justify-center items-center min-h-[400px] text-center'>
                        <div className='mb-6'>
                            <svg 
                                className='w-16 h-16 text-red-400 mx-auto mb-4' 
                                fill='none' 
                                stroke='currentColor' 
                                viewBox='0 0 24 24'
                            >
                                <path 
                                    strokeLinecap='round' 
                                    strokeLinejoin='round' 
                                    strokeWidth={2} 
                                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
                                />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                            Unable to Load Post
                        </h2>
                        <p className='text-gray-600 mb-6 max-w-md'>
                            {error}
                        </p>
                        <div className='flex gap-4'>
                            <button 
                                onClick={handleRetry}
                                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={() => navigate('/all-posts')}
                                className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200'
                            >
                                Back to Posts
                            </button>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    // Success state - render the form
    if (post) {
        return (
            <div className='py-8'>
                <Container>
                    <div className='mb-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-800 mb-2'>Edit Post</h1>
                                <p className='text-gray-600'>
                                    Editing: <span className='font-medium'>{post.title}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => navigate(`/post/${post.slug || post.$id}`)}
                                className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2'
                            >
                                <svg 
                                    className='w-4 h-4' 
                                    fill='none' 
                                    stroke='currentColor' 
                                    viewBox='0 0 24 24'
                                >
                                    <path 
                                        strokeLinecap='round' 
                                        strokeLinejoin='round' 
                                        strokeWidth={2} 
                                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' 
                                    />
                                    <path 
                                        strokeLinecap='round' 
                                        strokeLinejoin='round' 
                                        strokeWidth={2} 
                                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' 
                                    />
                                </svg>
                                View Post
                            </button>
                        </div>
                    </div>
                    <PostForm post={post} />
                </Container>
            </div>
        );
    }

    // Fallback - should not reach here
    return null;
}

export default EditPost;