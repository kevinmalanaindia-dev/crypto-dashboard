import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, Newspaper } from 'lucide-react';
import Image from 'next/image';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  imageurl: string;
  published_on: number;
  source: string;
  body: string;
  tags: string;
}

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.Data) {
          setNews(data.Data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p>Loading market news...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="text-blue-500" />
        <h2 className="text-xl font-bold text-slate-800">Crypto Market News</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, i) => (
          <motion.a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col h-full"
          >
            <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
              <Image
                src={item.imageurl}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => (e.currentTarget.src = '/placeholder-news.jpg')}
              />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                <Clock size={12} />
                {new Date(item.published_on * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-full">
                  {item.source}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[150px]">{item.tags.split('|')[0]}</span>
              </div>
              
              <h3 className="font-bold text-slate-800 leading-snug mb-3 group-hover:text-blue-600 transition-colors line-clamp-3">
                {item.title}
              </h3>
              
              <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                {item.body}
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-400 mt-auto">
                <span>Read more</span>
                <ExternalLink size={16} />
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
