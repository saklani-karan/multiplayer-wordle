import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Loader } from "../../components/display/Loader";
import { WordleBlocks } from "../../components/display/WordleBlocks";
import { useUserAuthContext } from "../../context/UserAuthProvider";
import { Google } from "../../icons";
import { client } from "../../utils";

const Auth = () => {
    const router = useRouter();
    const userAuthContext = useUserAuthContext();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        const query = router.query;
        let token = null;
        if (query?.token) {
            token = query.token;
        }

        if (!token && window !== undefined) {
            if (localStorage?.getItem("auth_token")) {
                token = localStorage.getItem("auth_token");
            }
        }

        if (token) {
            handleSuccessfulLogin(token);
        }
    }, [router.query]);

    const handleSuccessfulLogin = async (token) => {
        setIsAuthenticating(true);
        let user = null;
        try {
            user = await client(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (err) {
            removeCredentialsOnFailure();
            setIsAuthenticating(false);
            return;
        }
        setCredentialsOnAuthentication(token, user);
    };

    const setCredentialsOnAuthentication = (token, user) => {
        userAuthContext.saveToken(token);
        userAuthContext.saveUser(user);
        localStorage.setItem("auth_token", token);
        router.push("/");
    };

    const removeCredentialsOnFailure = () => {
        userAuthContext.resetToken();
        userAuthContext.resetUser();
        if (window !== undefined && localStorage.getItem("auth_token")) {
            localStorage.removeItem("auth_token");
        }
    };

    const handleAuthRedirect = () => {
        window.location.assign(process.env.NEXT_PUBLIC_API_AUTH_REDIRECT);
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <div className="flex-col flex space-y-4 items-center justify-center">
                <p className="text-3xl font-bold font-display text-purple-700">Murdle</p>
                <div className="flex-col space-y-1 justify-center item-center">
                    <p className="text-center text-lg font-light font-raleway text-gray-700">
                        Welcome to Multi-Wordle
                    </p>
                    <p className="text-center text-base font-light font-raleway text-gray-700">
                        Play your favorite worlde game but now also with
                        friends. Sign up here and start your multi-wordle experience
                    </p>
                </div>
                {isAuthenticating ? (
                    <Loader />
                ) : (
                    <button
                        className={`bg-white p-4 px-6 flex justify-center items-center space-x-4 shadow-lg sm:space-x-4 bg-red-100 rounded-full`}
                        onClick={handleAuthRedirect}
                        disabled={isAuthenticating}
                    >
                        <span className="w-5 h-5 sm:w-7 sm:h-7 text-red-400">
                            <Google />
                        </span>
                        <span className="text-base font-bold font-raleway text-red-600">
                            Sign in with Google
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Auth;
