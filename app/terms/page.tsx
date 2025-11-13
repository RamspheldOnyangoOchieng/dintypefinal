import { getTermsOfService } from "@/app/actions/document-actions";

export default async function TermsPage() {
    let content = "";
    
    try {
        content = await getTermsOfService();
    } catch (error) {
        console.error("Error fetching terms of service:", error);
        content = `
            <h2>Terms of Service</h2>
            <p>These terms of service govern your use of our platform.</p>
            <h3>Acceptance of Terms</h3>
            <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
            <h3>Use License</h3>
            <p>Permission is granted to temporarily use this service for personal, non-commercial transitory viewing only.</p>
            <h3>Disclaimer</h3>
            <p>The materials on this service are provided on an 'as is' basis. We make no warranties, expressed or implied.</p>
            <h3>Limitations</h3>
            <p>In no event shall we be liable for any damages arising out of the use or inability to use the materials on this service.</p>
            <h3>Contact Information</h3>
            <p>If you have any questions about these terms, please contact us.</p>
        `;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}