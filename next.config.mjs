import withPWAInit from "@ducanh2912/next-pwa";

dest: "public",
    register: true,
        skipWaiting: true,
            disable: false, // Enable PWA in dev for testing
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default withPWA(nextConfig);
