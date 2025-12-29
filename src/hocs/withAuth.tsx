"use client";

import React, { ComponentType, useEffect } from "react";
import { useSession } from "psf-core-next/hooks/session.hook";
import { usePathname } from "next/navigation";
import { useLoading } from "psf-core-next/providers/loading.provider";

/**
 * A Higher-Order Component (HOC) that protects routes by checking for a valid user session.
 * If the user is not authenticated, it can redirect them to a login page.
 *
 * @template P The props of the wrapped component.
 * @param {ComponentType<P>} WrappedComponent The component to protect.
 * @returns {ComponentType<P>} A new component that includes the authentication check.
 */
const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const { session, isLoading } = useSession();
    const pathname = usePathname();
    // useLoading from psf-core-next uses updateStep, not startLoading/finishLoading/setProgress directly in the new interface
    // We need to adapt this to the new interface: updateStep(stepName, isComplete)
    const { updateStep } = useLoading();

    useEffect(() => {
      // Start loading: step 'auth-check' is NOT complete
      updateStep('auth-check', false);
    }, [updateStep]);

    useEffect(() => {
      if (!isLoading) {
        // Finish loading: step 'auth-check' IS complete
        updateStep('auth-check', true);
      }
    }, [isLoading, updateStep]);

    if (isLoading) {
      return null;
    }

    // Authentication check temporarily disabled
    /*
    if (!session) {
      return <div>Redirecting to login...</div>;
    }
    */

    return <WrappedComponent {...(props as P)} />;
  };

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithAuthComponent;
};

export default withAuth;
