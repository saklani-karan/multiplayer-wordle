import "../styles/globals.css";
import { AuthLayout } from "../layouts/AuthLayout";
import Head from "next/head";
import { UserAuthWrapper } from "../context/UserAuthProvider";
import toast, { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }) {
    return (
        <main>
            <div className="hidden md:flex md:flex-col md:justify-center md:items-center md:h-full md:text-black md:text-center md:p-10">
                <div className="font-raleway text-2xl text-black">Oops!</div>
                <div className="font-raleway text-xl">We only support mobile devices!</div>
            </div>
            <div className="block md:hidden">
            <UserAuthWrapper>
            <AuthLayout>
                <Head>
                    <title>Multiwordle</title>
                    <meta
                        name="viewport"
                        content="initial-scale=1.0, width=device-width"
                    />
                    <link
                        rel="preconnect"
                        href="https://fonts.googleapis.com"
                    />
                    <link
                        rel="preconnect"
                        href="https://fonts.gstatic.com"
                        crossOrigin="anonymous"
                    />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
                        rel="stylesheet"
                    />
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500;600&family=Raleway:wght@300;400;500&family=Roboto:wght@100;300;400&display=swap" rel="stylesheet" />
                </Head>
                <Component {...pageProps} />
                
                
                <Toaster />
            </AuthLayout>
        </UserAuthWrapper>
            </div>
        </main>
        
    );
}

export default MyApp;
