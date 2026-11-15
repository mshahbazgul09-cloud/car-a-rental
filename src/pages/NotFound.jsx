import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";

export default function NotFound() {
  return (
    <section className="flex min-h-screen items-center bg-ink pt-20 text-center text-white">
      <Container>
        <p className="text-8xl font-extrabold text-brand">404</p>
        <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-white/60">The page you are looking for does not exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Button to="/">Back to home</Button>
          <Button to="/cars" variant="outlineLight">Browse cars</Button>
        </div>
      </Container>
    </section>
  );
}
