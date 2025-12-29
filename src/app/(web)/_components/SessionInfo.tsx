"use client";


import {useSession} from "psf-core-next/hooks/session.hook";
import {Avatar} from "psf-core-next/components/avatar/avatar";
import {Icon} from "psf-core-next/components/icon/icon";
import {Button} from "psf-core-next/components/button/button";
import {redirect} from "next/navigation";

/**
 * @interface UserSession
 * Defines the structure of the user session data.
 */
interface UserSession {
    image?: string;
    provider?: string;
    name?: {
        full?: string;
    };
    email?: string;
}

/**
 * Maps provider names from the token to their corresponding icon identifiers.
 * @param {string} provider - The provider name (e.g., 'google', 'twitter').
 * @returns {string} The icon identifier.
 */
const getProviderIcon = (provider: string): string => {
    const providerIcons: Record<string, string> = {
        google: "logos:google-icon",
        twitter: "logos:x",
        credentials: "lucide:mail",
    };
    return providerIcons[provider] || "lucide:shield-question";
};

export const SessionInfo = (): JSX.Element | null => {
    const {session, isLoading, signOut} = useSession();

    if (isLoading) {
        return <div className="w-full max-w-sm p-2 space-y-4 bg-white flex flex-col rounded-lg shadow-md">
            <div className="animate-pulse flex items-center space-x-4">
                <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-2 bg-gray-300 rounded"></div>
                    <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                </div>
            </div>
        </div>;
    }

    if (!session) {
        return null;
    }

    return <div className="w-full max-w-sm p-2 space-y-4 bg-white flex flex-col rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
            <div className="relative inline-block">
                <Avatar dbId={session.image} size="md"/>
                {session.provider ?
                    <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
          <span className="block p-1 bg-white rounded-full">
            <Icon icon={getProviderIcon(session.provider)} className="size-4"/>
          </span>
                    </div> :
                    <></>}
            </div>
            <div className="flex flex-col w-full">
                <p className="font-bold text-xs">{session.name?.full}</p>
                <p className="text-2xs italic lowercase">{session.email}</p>
            </div>
            <div className={"flex gap-2"}>
                <Button onPress={() => {
                    redirect('/user-profile')
                }} startContent={<Icon icon={'lucide:user-cog'}/>}/>
                <Button onPress={() => signOut()} startContent={<Icon icon={'lucide:log-out'}/>}/>
            </div>
        </div>
    </div>
};