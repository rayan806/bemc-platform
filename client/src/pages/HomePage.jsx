/**
 * Archivo: client/src/pages/HomePage.jsx
 * Proposito: Pagina de inicio publica con presentacion comercial.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import logo from '../assets/bemc-logo.png';
import { categoryLabels, getServicePresentation } from '../utils/servicePresentation';

const sstPillars = [
  {
    icon: 'bi-clipboard2-check',
    title: 'Diagnóstico inicial',
    text: 'Identificamos el estado real del cumplimiento SST y priorizamos las acciones necesarias.',
  },
  {
    icon: 'bi-shield-check',
    title: 'Prevención de riesgos',
    text: 'Ayudamos a controlar peligros laborales, incidentes, accidentes y enfermedades ocupacionales.',
  },
  {
    icon: 'bi-file-earmark-text',
    title: 'Documentación SST',
    text: 'Organizamos matrices, planes, evidencias, informes, certificados y soportes del sistema.',
  },
  {
    icon: 'bi-people',
    title: 'Acompañamiento',
    text: 'Guiamos a empresas y trabajadores con consultoría, capacitaciones y seguimiento continuo.',
  },
];

const processSteps = [
  'Registro del cliente o empresa',
  'Selección del servicio requerido',
  'Solicitud y revisión del caso',
  'Cotización, ejecución y entrega de soportes',
];

// Componente principal de esta vista.
export default function HomePage() {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    api
      .get('/services')
      .then((res) => setServices(res.data))
      .catch(console.error)
      .finally(() => setLoadingServices(false));
  }, []);

  return (
    <>
      <section className="home-hero">
        <div className="container">
          <div className="home-hero__grid">
            <div className="home-hero__content">
              <span className="home-eyebrow">BEMC Soluciones SST</span>
              <h1>Seguridad y Salud en el Trabajo para empresas que quieren cumplir y proteger.</h1>
              <p>
                Implementamos, auditamos y fortalecemos el SG-SST con acompañamiento profesional,
                gestión documental, capacitaciones, inspecciones y evaluación de riesgos laborales.
              </p>
              <div className="home-hero__actions">
                <Link to="/servicios" className="btn btn-accent btn-lg">
                  Ver servicios
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  Iniciar sesión
                </Link>
              </div>
            </div>

            <div className="home-hero__brand" aria-label="BEMC Soluciones SST">
              <img src={logo} alt="BEMC Soluciones SST" />
              <div>
                <strong>SG-SST</strong>
                <span>Consultoría, auditoría y prevención laboral</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container home-section">
        <div className="home-section__header">
          <span className="home-eyebrow home-eyebrow--dark">Que hacemos</span>
          <h2>Soluciones SST para cumplir la normativa colombiana</h2>
          <p>
            La seguridad y salud en el trabajo permite prevenir riesgos, cuidar a los trabajadores,
            mejorar procesos y mantener evidencia organizada ante auditorías o requerimientos.
          </p>
        </div>

        <div className="row g-4">
          {sstPillars.map((item) => (
            <div key={item.title} className="col-md-6 col-xl-3">
              <div className="home-info-card">
                <i className={`bi ${item.icon}`} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-services-band">
        <div className="container">
          <div className="home-section__header home-section__header--split">
            <div>
              <span className="home-eyebrow home-eyebrow--dark">Servicios</span>
              <h2>Catálogo de servicios BEMC</h2>
            </div>
            <p>
              Cada servicio puede solicitarse en línea. El administrador revisa la solicitud,
              prepara la cotización, gestiona documentos y da seguimiento al cliente.
            </p>
          </div>

          {loadingServices ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : (
            <div className="row g-4">
              {services.map((service) => {
                const visual = getServicePresentation(service);
                return (
                  <div key={service._id} className="col-md-6 col-xl-4">
                    <article className="home-service-card">
                      <div className={`service-image service-image--${visual.tone}`}>
                        <i className={`bi ${visual.icon}`} />
                        <span>{categoryLabels[service.category] || service.category}</span>
                      </div>
                    <span className="home-service-card__category">
                      {categoryLabels[service.category] || service.category}
                    </span>
                    <h3>{service.name}</h3>
                    <p>{service.description || service.shortDescription}</p>
                    <div className="home-service-card__meta">
                      <span>{service.duration || 'Según alcance'}</span>
                      <strong>Cotización personalizada</strong>
                    </div>
                    <Link to={`/servicios/${service.slug}`} className="btn btn-bemc w-100">
                      Ver información
                    </Link>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="container home-section">
        <div className="home-process">
          <div>
            <span className="home-eyebrow home-eyebrow--dark">Proceso</span>
            <h2>Cómo se gestiona una solicitud</h2>
            <p>
              El cliente puede registrarse, solicitar un servicio y hacer seguimiento desde su portal.
              El administrador ve clientes, empresas, cotizaciones y solicitudes desde el panel interno.
            </p>
          </div>
          <ol>
            {processSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-cta">
        <div className="container">
          <h2>¿Listo para organizar tu gestión SST?</h2>
          <p>
            Entra, crea tu cuenta o inicia sesión para solicitar servicios y consultar el avance.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/registro" className="btn btn-accent btn-lg">
              Crear cuenta
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
