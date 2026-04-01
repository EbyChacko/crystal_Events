import { Helmet } from 'react-helmet-async';
import { ServerCrash } from 'lucide-react';
import ErrorPage from './ErrorPage';

const ServerError = () => (
    <>
        <Helmet>
            <title>Server Error | Crystal Events Ireland</title>
            <meta name="robots" content="noindex" />
        </Helmet>
        <ErrorPage
            code="500"
            title="Something Went Wrong"
            description="We hit an unexpected error on our end. Our team has been notified. Please try again or head back home."
            icon={ServerCrash}
        />
    </>
);

export default ServerError;
