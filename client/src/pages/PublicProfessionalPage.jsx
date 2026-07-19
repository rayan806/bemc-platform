import { Link } from 'react-router-dom';

const faqs = [
  { q: 'Que necesito para registrarme?', a: 'Datos basicos, perfil profesional SST y soportes de certificaciones.' },
  { q: 'Como recibo oportunidades?', a: 'El sistema publica en tu panel solicitudes compatibles por ciudad, perfil y licencias vigentes.' },
  { q: 'Como me pagan?', a: 'La empresa acuerda el valor y el estado queda trazado en la asignacion del servicio.' },
];

export default function PublicProfessionalPage() {
  return (
    <section className="container py-5">
      <h1 className="h2 mb-3">Marketplace para Profesionales SST</h1>
      <p className="text-muted mb-4">Conecta con empresas, postulate a servicios y construye tu historial profesional en B.E.M.C.</p>

      <div className="row g-3 mb-4">
        <div className="col-md-4"><div className="card card-bemc p-3 h-100"><h3 className="h6">Beneficios</h3><p className="small text-muted mb-0">Accede a oportunidades compatibles, seguimiento de servicios y reputacion por calificaciones.</p></div></div>
        <div className="col-md-4"><div className="card card-bemc p-3 h-100"><h3 className="h6">Como funciona</h3><p className="small text-muted mb-0">Completa perfil, recibe solicitudes, envia propuesta, ejecuta reportes y cierra servicios.</p></div></div>
        <div className="col-md-4"><div className="card card-bemc p-3 h-100"><h3 className="h6">Requisitos</h3><p className="small text-muted mb-0">Licencia SST vigente, certificaciones y datos de experiencia profesional verificables.</p></div></div>
      </div>

      <div className="mb-4">
        <Link to="/registro" className="btn btn-bemc">Registrarme como profesional SST</Link>
      </div>

      <div className="card card-bemc p-3">
        <h2 className="h5">Preguntas frecuentes</h2>
        {faqs.map((f) => (
          <div key={f.q} className="mb-2">
            <strong>{f.q}</strong>
            <div className="text-muted small">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
