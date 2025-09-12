
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Privacy Policy
              </h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Your privacy and transparency are important. Here are the key things to know about Asra.
              </p>
            </div>
            <div className="mx-auto max-w-3xl space-y-8 pt-12">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">1. Not for Production Use</h2>
                    <p className="text-muted-foreground">
                        This application, "Asra," is a demonstration project and is **not intended for production use**. It is a proof-of-concept created to showcase AI capabilities in an educational context. As such, it may contain bugs, incomplete features, and should not be relied upon for critical tasks or the storage of sensitive personal information.
                    </p>
                </div>
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold">2. "Asra" Trademark</h2>
                    <p className="text-muted-foreground">
                        The name "Asra" is used for creative and illustrative purposes only. It is **not a registered trademark** and this project is not affiliated with any commercial entity. The application was created for fun and as a portfolio piece.
                    </p>
                </div>
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold">3. Data Usage</h2>
                    <p className="text-muted-foreground">
                        While the application includes features like user authentication and chat history, all data is stored in a development environment (Firebase). We do not sell or share your data with third parties. However, given the non-production nature of this app, please do not enter any real-world sensitive or personal data.
                    </p>
                </div>
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold">4. No Guarantees</h2>
                    <p className="text-muted-foreground">
                       This application is provided "as is" without any warranties of any kind. We make no guarantees regarding the accuracy of the information provided by the AI, the reliability of the features, or the security of the data. Use at your own risk.
                    </p>
                </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
