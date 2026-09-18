import { useState, useMemo, useEffect } from 'react';
import { 
  blogPosts, 
  blogCategories, 
  blogBySlug, 
  type BlogPost 
} from './blogData';
import { themeById, type ThemeId } from './data';
import { navigate, Brand, goToLandingSection } from './App';
import { 
  ArrowUpRight, 
  ArrowLeft, 
  MagnifyingGlass, 
  ShareNetwork, 
  Check, 
  Plus, 
  Flower, 
  Sparkle, 
  BookOpen, 
  CalendarBlank, 
  Clock, 
  Quotes
} from '@phosphor-icons/react';
import './blog.css';

interface BlogProps {
  slug?: string;
}

export default function Blog({ slug }: BlogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const post = slug ? blogBySlug(slug) : undefined;

  // Filter posts based on Category and Search Query
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((item) => {
      const matchesCategory = selectedCategory === 'All Articles' || item.category === selectedCategory;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Set Page Title, Meta Description & Inject JSON-LD Schema
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Vowvel Journal`;
      document.querySelector('meta[name="description"]')?.setAttribute('content', post.metaDescription);

      // Inject structured Article and FAQPage Schema for SEO/AI
      const schemaData = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: post.title,
            description: post.metaDescription,
            author: {
              '@type': 'Organization',
              name: post.author
            },
            publisher: {
              '@type': 'Organization',
              name: 'Vowvel',
              logo: {
                '@type': 'ImageObject',
                url: 'https://vowvel.com/wordmark.webp'
              }
            },
            datePublished: '2026-09-16T10:00:00+05:30',
            dateModified: '2026-09-16T10:00:00+05:30',
            mainEntityOfPage: `https://vowvel.com/#/blog/${post.slug}`
          },
          {
            '@type': 'FAQPage',
            mainEntity: post.faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
              }
            }))
          }
        ]
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'vowvel-blog-schema';
      script.innerHTML = JSON.stringify(schemaData);
      document.head.appendChild(script);

      return () => {
        const existingScript = document.getElementById('vowvel-blog-schema');
        if (existingScript) existingScript.remove();
      };
    } else {
      document.title = 'The Vowvel Journal | Wedding Stationery Design, Aesthetics & Craft';
      document.querySelector('meta[name="description"]')?.setAttribute(
        'content',
        'Explore 20 in-depth essays on botanical romance, royal Indian palaces, black-tie midnight glamour, playful papercraft, and the sensory craft of digital wedding stationery.'
      );
    }
  }, [post]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If a specific post slug is active, render Article Detail View
  if (slug && post) {
    const themeObj = post.themeId !== 'all' ? themeById(post.themeId as ThemeId) : undefined;

    return (
      <div className="journal-page">
        <header className="site-nav">
          <Brand />
          <nav aria-label="Journal navigation">
            <a href="#designs" onClick={event => { event.preventDefault(); goToLandingSection('designs'); }}>The collection</a>
            <a href="#/blog">Journal</a>
            <a href="#how-it-works" onClick={event => { event.preventDefault(); goToLandingSection('how-it-works'); }}>How it works</a>
            <a href="#pricing" onClick={event => { event.preventDefault(); goToLandingSection('pricing'); }}>Pricing</a>
          </nav>
          <div className="nav-actions">
            <button className="button compact" onClick={() => navigate('/create/gulmohar')}>
              Create yours <ArrowUpRight size={16} />
            </button>
          </div>
        </header>

        <main className="article-container" id="main">
          {/* Breadcrumb Navigation */}
          <nav className="article-breadcrumb" aria-label="Breadcrumb">
            <a href="#/">Home</a>
            <span>/</span>
            <a href="#/blog">Journal</a>
            <span>/</span>
            <span>{post.category}</span>
          </nav>

          {/* Article Header */}
          <header className="article-header">
            <span className="article-header-tag">
              <Flower size={16} weight="thin" /> {post.category}
            </span>
            <h1>{post.title}</h1>
            <p className="article-subtitle">{post.subtitle}</p>

            <div className="article-meta-bar">
              <div className="article-author-info">
                <BookOpen size={16} />
                <span>By <strong>{post.author}</strong> · {post.authorRole}</span>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <span><CalendarBlank size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> {post.publishedDate}</span>
                <span><Clock size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} /> {post.readTime}</span>
              </div>
              <div className="article-actions">
                <button className="share-btn" onClick={handleShare} aria-label="Share this essay">
                  {copied ? <Check size={15} color="#43523c" /> : <ShareNetwork size={15} />}
                  <span>{copied ? 'Link copied!' : 'Share'}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Citation & Executive Summary Callout (AI & Search Optimized) */}
          <section className="citation-box" aria-label="Key Takeaways and Definition">
            <div className="citation-header">
              <Quotes size={16} weight="fill" /> Key Takeaway & Definitive Summary
            </div>
            <p className="citation-definition">{post.citationDefinition}</p>
            <ul className="citation-takeaways">
              {post.keyTakeaways.map((takeaway, index) => (
                <li key={index}>{takeaway}</li>
              ))}
            </ul>
          </section>

          {/* Render Main Article Content */}
          <article className="article-body">
            {post.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={index}>{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('### ')) {
                return <h3 key={index}>{paragraph.replace('### ', '')}</h3>;
              }
              if (paragraph.startsWith('> ')) {
                return <blockquote key={index}>{paragraph.replace('> ', '')}</blockquote>;
              }
              if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
                const items = paragraph.split('\n');
                return (
                  <ul key={index}>
                    {items.map((item, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/^[-*0-9.]+\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
                    ))}
                  </ul>
                );
              }
              if (paragraph.startsWith('| ')) {
                const rows = paragraph.split('\n').filter(r => !r.includes(':---'));
                const [headerRow, ...bodyRows] = rows;
                return (
                  <div style={{ overflowX: 'auto' }} key={index}>
                    <table>
                      <thead>
                        <tr>
                          {headerRow.split('|').filter(c => c.trim()).map((col, i) => (
                            <th key={i}>{col.trim()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bodyRows.map((row, i) => (
                          <tr key={i}>
                            {row.split('|').filter(c => c.trim()).map((col, j) => (
                              <td key={j} dangerouslySetInnerHTML={{ __html: col.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return (
                <p 
                  key={index} 
                  dangerouslySetInnerHTML={{ 
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`([^`]+)`/g, '<code>$1</code>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} 
                />
              );
            })}
          </article>

          {/* Interactive Showcase Box for Relevant Theme */}
          {themeObj && (
            <section className="post-suite-showcase">
              <div>
                <span className="eyebrow"><Sparkle size={15} /> SIGNATURE COLLECTION</span>
                <h3>Experience {themeObj.name}</h3>
                <p>{themeObj.description}</p>
              </div>
              <div className="showcase-actions">
                <button className="button secondary" onClick={() => navigate(`/preview/${themeObj.id}`)}>
                  Live preview
                </button>
                <button className="button" onClick={() => navigate(`/create/${themeObj.id}`)}>
                  Make yours <ArrowUpRight size={16} />
                </button>
              </div>
            </section>
          )}

          {/* FAQ Accordion Section */}
          {post.faq.length > 0 && (
            <section className="article-faq-section" aria-label="Frequently Asked Questions">
              <span className="eyebrow">QUESTIONS & ANSWERS</span>
              <h3>Frequently Asked</h3>
              {post.faq.map((faqItem, idx) => (
                <details key={idx} className="faq-item">
                  <summary>{faqItem.question} <Plus size={16} /></summary>
                  <p>{faqItem.answer}</p>
                </details>
              ))}
            </section>
          )}

          {/* Related Articles */}
          {post.relatedSlugs.length > 0 && (
            <section className="related-posts-section">
              <span className="eyebrow">CONTINUE READING</span>
              <h3>Related Stories</h3>
              <div className="related-posts-grid">
                {post.relatedSlugs.map((relSlug) => {
                  const relPost = blogBySlug(relSlug);
                  if (!relPost) return null;
                  return (
                    <div 
                      key={relSlug} 
                      className="related-card"
                      onClick={() => navigate(`/blog/${relPost.slug}`)}
                    >
                      <span>{relPost.category}</span>
                      <h4>{relPost.title}</h4>
                      <small>{relPost.readTime}</small>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Back to Journal CTA */}
          <div style={{ marginTop: '50px', textAlign: 'center' }}>
            <button className="text-button" onClick={() => navigate('/blog')}>
              <ArrowLeft size={16} /> Back to Journal
            </button>
          </div>
        </main>

        <footer className="site-footer wrap">
          <Brand />
          <span>Made for your kind of love.</span>
          <a href="#/blog">Journal</a>
          <a href="#designs" onClick={event => { event.preventDefault(); goToLandingSection('designs'); }}>Explore the collection <ArrowUpRight size={14} /></a>
        </footer>
      </div>
    );
  }

  // Otherwise, render the main Journal Listing / Hub view (`#/blog`)
  const featuredPost = blogPosts[0];

  return (
    <div className="journal-page">
      <header className="site-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#designs" onClick={event => { event.preventDefault(); goToLandingSection('designs'); }}>The collection</a>
          <a href="#/blog" style={{ textDecoration: 'underline', textUnderlineOffset: '6px' }}>Journal</a>
          <a href="#how-it-works" onClick={event => { event.preventDefault(); goToLandingSection('how-it-works'); }}>How it works</a>
          <a href="#pricing" onClick={event => { event.preventDefault(); goToLandingSection('pricing'); }}>Pricing</a>
        </nav>
        <div className="nav-actions">
          <button className="button compact" onClick={() => navigate('/create/gulmohar')}>
            Create yours <ArrowUpRight size={16} />
          </button>
        </div>
      </header>

      <div className="journal-header">
        <div className="wrap">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>
            <Flower size={18} weight="thin" /> THE VOWVEL ATELIER JOURNAL
          </span>
          <h1>Essays on Craft,<br /><em>Beauty & Guest Delight.</em></h1>
          <p>
            Explore our curated guides on botanical romance, royal palace heritage, midnight glamour, papercraft aesthetics, and the emotional psychology of unforgettable wedding invitations.
          </p>
        </div>
      </div>

      <main className="wrap" id="main">
        {/* Search & Category Filter Bar */}
        <div className="journal-controls">
          <div className="journal-search-wrap">
            <div className="journal-category-chips" role="tablist">
              {blogCategories.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className={`journal-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="journal-search-input">
              <MagnifyingGlass size={16} color="#798072" />
              <input
                type="text"
                placeholder="Search 20 essays and designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search blog articles"
              />
            </div>
          </div>
        </div>

        {/* Featured Post Card (shown when no search query and 'All Articles') */}
        {selectedCategory === 'All Articles' && !searchQuery && (
          <article 
            className="journal-featured" 
            onClick={() => navigate(`/blog/${featuredPost.slug}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="featured-art-cover">
              <img 
                src="/art/conservatory.webp" 
                alt="Botanical glasshouse invitation artwork" 
                width="800" 
                height="600" 
                loading="eager" 
              />
            </div>
            <div className="featured-content">
              <span className="featured-badge">
                <Sparkle size={14} /> FEATURED ESSAY · {featuredPost.category}
              </span>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.subtitle}</p>
              <div className="featured-meta">
                <span>By {featuredPost.author}</span>
                <span>·</span>
                <span>{featuredPost.publishedDate}</span>
                <span>·</span>
                <span>{featuredPost.readTime}</span>
              </div>
            </div>
          </article>
        )}

        {/* Article Grid */}
        <section aria-label="Journal Articles" className="journal-grid">
          {filteredPosts.map((article) => {
            const suite = article.themeId !== 'all' ? themeById(article.themeId as ThemeId) : undefined;
            const artImage = suite?.art || '/art/azure.webp';

            return (
              <article
                key={article.slug}
                className="journal-card"
                onClick={() => navigate(`/blog/${article.slug}`)}
              >
                <div className="journal-card-art">
                  <img 
                    src={artImage} 
                    alt={article.title} 
                    loading="lazy" 
                    width="400" 
                    height="200" 
                  />
                  {suite && <span className="card-suite-tag">{suite.name}</span>}
                </div>
                <div className="journal-card-body">
                  <span className="journal-card-category">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.subtitle}</p>
                  <div className="journal-card-footer">
                    <span>{article.readTime}</span>
                    <span className="journal-read-link">
                      Read story <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {filteredPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#73766c' }}>
            <p style={{ fontSize: '18px', fontFamily: 'var(--serif)' }}>No articles found matching "{searchQuery}".</p>
            <button 
              className="button secondary" 
              style={{ marginTop: '16px' }}
              onClick={() => { setSearchQuery(''); setSelectedCategory('All Articles'); }}
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      <footer className="site-footer wrap" style={{ marginTop: '80px' }}>
        <Brand />
        <span>Made for your kind of love.</span>
        <a href="#designs" onClick={event => { event.preventDefault(); goToLandingSection('designs'); }}>The collection</a>
        <a href="#/blog">Journal</a>
      </footer>
    </div>
  );
}
