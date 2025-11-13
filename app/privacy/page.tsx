import { getPrivacyPolicy } from "@/app/actions/document-actions";

export default async function PrivacyPage() {
    let content = "";
    
    try {
        content = await getPrivacyPolicy();
    } catch (error) {
        console.error("Error fetching privacy policy:", error);
        content = `
            <h2>Privacy Policy</h2>
            <p>This privacy policy outlines how we collect, use, and protect your information.</p>
            <h3>Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account or use our services.</p>
            <h3>How We Use Your Information</h3>
            <p>We use the information we collect to provide, maintain, and improve our services.</p>
            <h3>Information Sharing</h3>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.</p>
            <h3>Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information.</p>
            <h3>Contact Us</h3>
            <p>If you have any questions about this privacy policy, please contact us.</p>
        `;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}