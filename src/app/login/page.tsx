'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await signIn(values.email, values.password);
        //toast.success('Login successful');
        // The router.push will happen in the AuthContext useEffect
      } catch (error: any) {
        console.error('Login error:', error);
        toast.error(error.message || 'Failed to login');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 animate-in">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto flex items-center justify-center mb-4">
            <FiUser className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Welcome back</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Sign in to access your account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                icon={<FiMail className="h-5 w-5 text-neutral-400" />}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email ? formik.errors.email : undefined}
              />
              
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                icon={<FiLock className="h-5 w-5 text-neutral-400" />}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password ? formik.errors.password : undefined}
              />

              <Button 
                type="submit"
                className="w-full"
                isLoading={formik.isSubmitting}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
            <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
              Don't have an account? Contact an administrator for access.
            </p>
            </CardFooter>
        </Card>
        
        <p className="text-center mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          MoonDev Coding Challenge © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}