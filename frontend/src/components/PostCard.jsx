import React, { useState, useEffect } from 'react';
import appwriteService from "../appwrite/config";
import { Link } from 'react-router-dom';

function PostCard({ $id, id, title, featuredImage, slug }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Use slug for navigation if available, fallback to $id or id
    const postId = slug || $id || id;

    useEffect(() => {
        const loadImage = async () => {
            if (!featuredImage) {
                setImageLoading(false);
                return;
            }

            try {
                setImageLoading(true);
                setImageError(false);

                // Django service returns async preview URL
                const url = await appwriteService.getFileViewAsync(featuredImage);
                
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
    }, [featuredImage]);

    return (
        <Link to={`/post/${postId}`}>
            <div className='w-full bg-gray-100 rounded-xl p-4 hover:bg-gray-200 transition-colors duration-200'>
                <div className='w-full justify-center mb-4'>
                    {imageLoading ? (
                        <div className='w-full h-48 bg-gray-300 rounded-xl flex items-center justify-center'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600'></div>
                        </div>
                    ) : imageError || !imageUrl ? (
                        <div className='w-full h-48 bg-gray-300 rounded-xl flex items-center justify-center'>
                            <svg 
                                className='w-12 h-12 text-gray-500' 
                                fill='none' 
                                stroke='currentColor' 
                                viewBox='0 0 24 24'
                            >
                                <path 
                                    strokeLinecap='round' 
                                    strokeLinejoin='round' 
                                    strokeWidth={2} 
                                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' 
                                />
                            </svg>
                        </div>
                    ) : (
                        <img 
                            src={imageUrl} 
                            alt={title}
                            className='rounded-xl w-full h-48 object-cover'
                            onError={() => {
                                setImageError(true);
                                setImageUrl(null);
                            }}
                        />
                    )}
                </div>
                <h2 className='text-xl font-bold text-gray-800 line-clamp-2'>
                    {title}
                </h2>
            </div>
        </Link>
    );
}

export default PostCard;