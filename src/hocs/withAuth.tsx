"use client";

import React, { ComponentType, useEffect } from "react";
import { useSession } from "psf-core-next/hooks/session.hook";
import { usePathname, redirect } from "next/navigation";
import { useLoading } from "psf-core-next/providers/loading.provider";

/**
 * A Higher-Order Component (HOC) that protects routes by checking for a valid user session.
 * If the user is not authenticated, it redirects them to the central auth service.
 *
 * @template P The props of the wrapped component.
 * @param {ComponentType<P>} WrappedComponent The component to protect.
 * @returns {ComponentType<P>} A new component that includes the authentication check.
 */
const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const { session, isLoading } = useSession();
    const pathname = usePathname();
    const { updateStep } = useLoading();

    useEffect(() => {
      updateStep('auth-check', false);
    }, [updateStep]);

    useEffect(() => {
      if (!isLoading) {
        updateStep('auth-check', true);
      }
    }, [isLoading, updateStep]);

    if (isLoading) {
      return null; // Or a skeleton loader
    }

    if (!session) {
      const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3005';
      const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || 'home-server';
      
      // The URL we want to be returned to after login
      const forwardUrl = window.location.href;

      const loginUrl = new URL(`${authServiceUrl}/login`);
      loginUrl.searchParams.set('service', serviceKey);
      loginUrl.searchParams.set('forwardUrl', forwardUrl);
      
      // Use Next.js redirect to navigate to the login page
      redirect(loginUrl.toString());
      
      // Return null while redirecting
      return null;
    }

    return <WrappedComponent {...(props as P)} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithAuthComponent;
};

export default withAuth;
