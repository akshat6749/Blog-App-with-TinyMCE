import React, { useState, useEffect } from 'react';
import { Container, PostCard } from '../components';
import appwriteService from "../appwrite/config";

function AllPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get all active posts
                const response = await appwriteService.getPosts([]);
                
                if (response && response.documents) {
                    setPosts(response.documents);
                } else if (response === false) {
                    // Django service returns false on error
                    setError("Failed to fetch posts. Please try again later.");
                } else {
                    // Handle case where response is null/undefined
                    setError("No posts found or service unavailable.");
                }
            } catch (err) {
                console.error("Error fetching posts:", err);
                
                // Handle specific error types
                if (err.message === 'Authentication required') {
                    setError("Please log in to view posts.");
                } else if (err.response?.status === 404) {
                    setError("Posts not found.");
                } else if (err.response?.status >= 500) {
                    setError("Server error. Please try again later.");
                } else {
                    setError("Failed to load posts. Please check your connection and try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // Retry function for failed requests
    const handleRetry = () => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await appwriteService.getPosts([]);
                
                if (response && response.documents) {
                    setPosts(response.documents);
                } else {
                    setError("Failed to fetch posts. Please try again later.");
                }
            } catch (err) {
                console.error("Error fetching posts:", err);
                setError("Failed to load posts. Please check your connection and try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    };

    if (loading) {
        return (
            <div className='w-full py-8'>
                <Container>
                    <div className='flex justify-center items-center min-h-[200px]'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
                        <span className='ml-3 text-lg text-gray-600'>Loading posts...</span>
                    </div>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div className='w-full py-8'>
                <Container>
                    <div className='flex flex-col justify-center items-center min-h-[200px] text-center'>
                        <div className='mb-4'>
                            <svg 
                                className='w-16 h-16 text-gray-400 mx-auto mb-4' 
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
                        <h3 className='text-xl font-semibold text-gray-700 mb-2'>
                            Oops! Something went wrong
                        </h3>
                        <p className='text-gray-600 mb-4 max-w-md'>
                            {error}
                        </p>
                        <button 
                            onClick={handleRetry}
                            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200'
                        >
                            Try Again
                        </button>
                    </div>
                </Container>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className='w-full py-8'>
                <Container>
                    <div className='flex flex-col justify-center items-center min-h-[200px] text-center'>
                        <div className='mb-4'>
                            <svg 
                                className='w-16 h-16 text-gray-400 mx-auto mb-4' 
                                fill='none' 
                                stroke='currentColor' 
                                viewBox='0 0 24 24'
                            >
                                <path 
                                    strokeLinecap='round' 
                                    strokeLinejoin='round' 
                                    strokeWidth={2} 
                                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' 
                                />
                            </svg>
                        </div>
                        <h3 className='text-xl font-semibold text-gray-700 mb-2'>
                            No Posts Found
                        </h3>
                        <p className='text-gray-600'>
                            There are no posts to display at the moment.
                        </p>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className='w-full py-8'>
            <Container>
                <div className='mb-6'>
                    <h1 className='text-3xl font-bold text-gray-800 mb-2'>All Posts</h1>
                    <p className='text-gray-600'>
                        {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
                    </p>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                    {posts.map((post) => (
                        <div key={post.$id || post.id} className=''>
                            <PostCard {...post} />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    );
}

export default AllPosts;