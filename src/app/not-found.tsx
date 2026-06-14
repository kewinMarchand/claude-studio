import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="notfound">
      <span className="notfound__logo" aria-hidden="true">
        ✳
      </span>
      <h1 className="notfound__title">404 — page introuvable</h1>
      <p className="notfound__text">Cette adresse n’existe pas dans Claude Studio.</p>
      <Link href="/" className="notfound__link">
        Retour à l’accueil
      </Link>
    </div>
  )
}
