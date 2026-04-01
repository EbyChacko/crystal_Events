import { Helmet } from 'react-helmet-async';
import { ShieldX } from 'lucide-react';
import ErrorPage from './ErrorPage';

const Forbidden = () => (
    <>
        <Helmet>
            <title>Access Denied | Crystal Events Ireland</title>
            <meta name="robots" content="noindex" />
        </Helmet>
        <ErrorPage
            code="403"
            title="Access Denied"
            description="You don't have permission to view this page. If you believe this is a mistake, please contact an administrator."
            icon={ShieldX}
        />
    </>
);

export default Forbidden;
