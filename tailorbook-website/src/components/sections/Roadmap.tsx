import { useEffect, useRef } from 'react';
import { CheckCircle, Clock, Zap, Telescope } from 'lucide-react';

const COLUMNS = [
  {
    key: 'available',
    label: 'Available Now',
    icon: CheckCircle,
    items: [
      { name: 'Customer Profiles',        desc: 'Full contact & history'       },
      { name: 'Measurement Library',      desc: 'All garment types'            },
      { name: 'Job Pipeline',             desc: '6-stage tracking'             },
      { name: 'Delivery Reminders',       desc: 'Automatic notifications'      },
      { name: 'WhatsApp Integration',     desc: 'One-tap messaging'            },
      { name: 'Financial Tracking',       desc: 'Price, deposit & balance'     },
      { name: 'Offline-First',            desc: 'No internet required'         },
      { name: 'Scratch Pad',              desc: 'Quick notes & reminders'      },
      { name: 'Photo Attachments',        desc: 'Garment & fabric photos'      },
      { name: 'Custom Job Reminders',     desc: 'Set any alert date'           },
    ],
  },
  {
    key: 'development',
    label: 'In Development',
    icon: Clock,
    items: [
      { name: 'AI Design Studio',         desc: 'Generate outfit ideas'        },
      { name: 'Design Library',           desc: 'Save approved designs'        },
      { name: 'Production Dashboard',     desc: 'Workshop-wide overview'       },
      { name: 'Waybill Generator',        desc: 'Printable delivery notes'     },
      { name: 'Staff Assignment',         desc: 'Assign jobs to tailors'       },
      { name: 'Expense Tracking',         desc: 'Fabric & material costs'      },
    ],
  },
  {
    key: 'coming',
    label: 'Coming Soon',
    icon: Zap,
    items: [
      { name: 'Cloud Backup',             desc: 'Sync across devices'          },
      { name: 'Customer Memory AI',       desc: 'Style & preference recall'    },
      { name: 'iOS App',                  desc: 'iPhone support'               },
      { name: 'WhatsApp Templates',       desc: 'Pre-built message flows'      },
      { name: 'Invoice Generation',       desc: 'Professional PDF invoices'    },
      { name: 'Premium Tier',             desc: 'Advanced features & support'  },
      { name: 'Multi-Device Sync',        desc: 'Tablet & phone together'      },
    ],
  },
  {
    key: 'future',
    label: 'Future Vision',
    icon: Telescope,
    items: [
      { name: 'Marketplace',              desc: 'Connect tailors & customers'  },
      { name: 'Fabric Visualization',     desc: 'See fabric on designs'        },
      { name: 'AI Body Adaptation',       desc: 'Fit to body type'             },
      { name: 'Developer API',            desc: 'Build on TailorBook'          },
      { name: 'Fashion School Tools',     desc: 'Educational workflows'        },
      { name: 'Enterprise Plan',          desc: 'Multi-location studios'       },
      { name: 'Partner Program',          desc: 'Fabric supplier integrations' },
      { name: 'Community Forum',          desc: 'Tailors helping tailors'      },
    ],
  },
];

export default function Roadmap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-visible'); obs.disconnect(); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="roadmap" className="section section--dark-2">
      <div className="container">
        <div className="section-header section-header--center">
          <div className="section-label section-label--dark">Roadmap</div>
          <h2 className="section-title section-title--light">Where We Are. Where We're Going.</h2>
          <p className="section-desc section-desc--light">
            We build in the open. Every stage is shared honestly — what's working today,
            what's being built, and where we're headed long-term.
          </p>
        </div>

        <div className="roadmap__grid animate-stagger" ref={ref}>
          {COLUMNS.map(({ key, label, icon: Icon, items }) => (
            <div key={key} className="roadmap__column">
              <div className={`roadmap__col-header roadmap__col-header--${key}`}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </div>
              <ul className="roadmap__items" aria-label={label}>
                {items.map(({ name, desc }) => (
                  <li key={name} className="roadmap__item">
                    <div className="roadmap__item-name">{name}</div>
                    <div className="roadmap__item-desc">{desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
