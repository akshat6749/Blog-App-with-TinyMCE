import React, { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.slug || post?.$id || "",
            content: post?.content || "",
            status: post?.status || "active",
        },
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load existing image preview if editing a post
    useEffect(() => {
        if (post && post.featuredImage) {
            // Django service returns async preview URL
            appwriteService.getFilePreviewAsync(post.featuredImage)
                .then(url => {
                    if (url) {
                        setImagePreviewUrl(url);
                    }
                })
                .catch(error => {
                    console.error("Error loading image preview:", error);
                });
        }
    }, [post]);

    const submit = async (data) => {
        console.log("Form submitted with data:", data);
        setIsSubmitting(true);
        
        try {
            if (post) {
                // Updating existing post
                const updateData = {
                    title: data.title,
                    content: data.content,
                    status: data.status,
                };

                // Handle image update
                if (data.image?.[0]) {
                    // Upload new image first
                    const file = await appwriteService.uploadFile(data.image[0]);
                    if (file) {
                        updateData.featuredImage = data.image[0]; // Django expects the actual file
                        
                        // Delete old image after successful upload
                        if (post.featuredImage) {
                            await appwriteService.deleteFile(post.featuredImage);
                        }
                    } else {
                        alert("Failed to upload new image. Please try again.");
                        return;
                    }
                }

                const dbPost = await appwriteService.updatePost(post.slug || post.$id, updateData);

                if (dbPost) {
                    navigate(`/post/${dbPost.slug || dbPost.$id}`);
                } else {
                    alert("Failed to update post. Please try again.");
                }
            } else {
                // Creating new post
                if (!data.image?.[0]) {
                    alert("Please select an image for the post");
                    return;
                }

                const createData = {
                    ...data,
                    featuredImage: data.image[0], // Django expects the actual file
                    userId: userData.$id || userData.id
                };

                const dbPost = await appwriteService.createPost(createData);

                if (dbPost) {
                    navigate(`/post/${dbPost.slug || dbPost.$id}`);
                } else {
                    alert("Failed to create post. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            
            // Handle specific error messages
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else if (error.message === 'Authentication required') {
                alert("Please log in to continue.");
                // Optionally redirect to login page
                navigate('/login');
            } else {
                alert("An error occurred while saving the post. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string")
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-")
                .replace(/-+/g, "-") // Replace multiple consecutive dashes with single dash
                .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

        return "";
    }, []);

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title), { shouldValidate: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    // Handle image preview for new uploads
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviewUrl(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { required: "Title is required" })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { required: "Slug is required" })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                <RTE 
                    label="Content :" 
                    name="content" 
                    control={control} 
                    defaultValue={getValues("content")} 
                />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { 
                        required: !post ? "Featured image is required" : false 
                    })}
                    onChange={(e) => {
                        handleImageChange(e);
                        // Also call the original register onChange if it exists
                        const { onChange } = register("image", { 
                            required: !post ? "Featured image is required" : false 
                        });
                        onChange(e);
                    }}
                />
                {imagePreviewUrl && (
                    <div className="w-full mb-4">
                        <img
                            src={imagePreviewUrl}
                            alt={post?.title || "Image preview"}
                            className="rounded-lg max-w-full h-auto"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            {post ? "Current image" : "Preview"}
                        </p>
                    </div>
                )}
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: "Status is required" })}
                />
                <Button 
                    type="submit" 
                    bgColor={post ? "bg-green-500" : undefined} 
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting 
                        ? (post ? "Updating..." : "Creating...") 
                        : (post ? "Update" : "Submit")
                    }
                </Button>
            </div>
        </form>
    );
}