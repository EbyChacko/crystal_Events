import { Helmet } from 'react-helmet-async';
import { SearchX } from 'lucide-react';
import ErrorPage from './ErrorPage';

const NotFound = () => (
    <>
        <Helmet>
            <title>Page Not Found | Crystal Events Ireland</title>
            <meta name="robots" content="noindex" />
        </Helmet>
        <ErrorPage
            code="404"
            title="Page Not Found"
            description="The page you're looking for doesn't exist or may have been moved. Let's get you back on track."
            icon={SearchX}
        />
    </>
);

export default NotFound;
