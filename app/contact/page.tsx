export default function ContactPage() {
  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1>Contact Us</h1>

      <p>If you have any questions, feedback, or business inquiries, contact us:</p>

      <p>
        <strong>Email:</strong> foopyapp@gmail.com
      </p>

      <p>We’ll try to respond as soon as possible.</p>

      <img
        src="/friend.jpg"
        alt="My Friend"
        style={{
          width: "250px",
          borderRadius: "20px",
          marginTop: "30px",
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}