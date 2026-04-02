export default function PrivacyPage() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h1>Privacy Policy</h1>

      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        CocoFooty ("we", "our", "us") operates this website. This page informs you of our policies regarding the collection, use, and disclosure of personal data.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We may collect basic information such as usage data, cookies, and analytics to improve our service.
      </p>

      <h2>Advertising</h2>
      <p>
        We use Google AdSense to display ads. Google may use cookies to show ads based on your visits to this and other websites.
      </p>

      <h2>Cookies</h2>
      <p>
        Cookies are used to track activity and improve user experience.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions, contact us at: cocofooty@gmail.com
      </p>
    </div>
  );
}