import React, {useState} from 'react'
import authService from '../appwrite/auth'
import {Link ,useNavigate} from 'react-router-dom'
import {login} from '../store/authSlice'
import {Button, Input, Logo} from './index.js'
import {useDispatch} from 'react-redux'
import {useForm} from 'react-hook-form'

function Signup() {
    const navigate = useNavigate()
    const [error, setError] = useState("")
    const dispatch = useDispatch()
    const {register, handleSubmit, watch, formState: {errors}} = useForm()
    
    // Watch password field to validate password confirmation
    const password = watch("password", "")

    const create = async(data) => {
        setError("")
        try {
            // Prepare data according to Django serializer
            const signupData = {
                username: data.username,
                email: data.email,
                first_name: data.firstName,
                last_name: data.lastName,
                password: data.password,
                password_confirm: data.passwordConfirm
            }
            
            const userData = await authService.createAccount(signupData)
            if (userData) {
                const currentUser = await authService.getCurrentUser()
                if(currentUser) dispatch(login(currentUser));
                navigate("/")
            }
        } catch (error) {
            // Handle Django validation errors
            if (error.response && error.response.data) {
                const errorData = error.response.data
                if (typeof errorData === 'object') {
                    // Handle field-specific errors
                    const errorMessages = []
                    Object.keys(errorData).forEach(key => {
                        if (Array.isArray(errorData[key])) {
                            errorMessages.push(...errorData[key])
                        } else {
                            errorMessages.push(errorData[key])
                        }
                    })
                    setError(errorMessages.join(', '))
                } else {
                    setError(errorData)
                }
            } else {
                setError(error.message || "An error occurred during registration")
            }
        }
    }

   return (
    <div className="flex items-center justify-center">
            <div className={`mx-auto w-full max-w-lg bg-gray-100 rounded-xl p-10 border border-black/10`}>
            <div className="mb-2 flex justify-center">
                    <span className="inline-block w-full max-w-[100px]">
                        <Logo width="100%" />
                    </span>
                </div>
                <h2 className="text-center text-2xl font-bold leading-tight">Sign up to create account</h2>
                <p className="mt-2 text-center text-base text-black/60">
                    Already have an account?&nbsp;
                    <Link
                        to="/login"
                        className="font-medium text-primary transition-all duration-200 hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
                {error && <p className="text-red-600 mt-8 text-center">{error}</p>}

                <form onSubmit={handleSubmit(create)}>
                    <div className='space-y-5'>
                        <Input
                        label="Username: "
                        placeholder="Enter your username"
                        {...register("username", {
                            required: "Username is required",
                            minLength: {
                                value: 3,
                                message: "Username must be at least 3 characters"
                            }
                        })}
                        />
                        {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username.message}</p>}
                        
                        <Input
                        label="Email: "
                        placeholder="Enter your email"
                        type="email"
                        {...register("email", {
                            required: "Email is required",
                            validate: {
                                matchPattern: (value) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                                "Email address must be a valid address",
                            }
                        })}
                        />
                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                        
                        <Input
                        label="First Name: "
                        placeholder="Enter your first name"
                        {...register("firstName", {
                            required: "First name is required",
                        })}
                        />
                        {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName.message}</p>}
                        
                        <Input
                        label="Last Name: "
                        placeholder="Enter your last name"
                        {...register("lastName", {
                            required: "Last name is required",
                        })}
                        />
                        {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName.message}</p>}
                        
                        <Input
                        label="Password: "
                        type="password"
                        placeholder="Enter your password"
                        {...register("password", {
                            required: "Password is required",
                            minLength: {
                                value: 8,
                                message: "Password must be at least 8 characters"
                            }
                        })}
                        />
                        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
                        
                        <Input
                        label="Confirm Password: "
                        type="password"
                        placeholder="Confirm your password"
                        {...register("passwordConfirm", {
                            required: "Please confirm your password",
                            validate: value =>
                                value === password || "Passwords do not match"
                        })}
                        />
                        {errors.passwordConfirm && <p className="text-red-600 text-sm mt-1">{errors.passwordConfirm.message}</p>}
                        
                        <Button type="submit" className="w-full">
                            Create Account
                        </Button>
                    </div>
                </form>
            </div>
     </div>
  )
}

export default Signup