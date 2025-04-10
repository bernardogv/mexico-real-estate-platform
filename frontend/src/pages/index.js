import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [language, setLanguage] = useState('es'); // Default to Spanish

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const translations = {
    es: {
      title: 'Plataforma Inmobiliaria de México',
      subtitle: 'Encuentra tu próxima propiedad en México',
      search: 'Buscar',
      location: 'Ubicación',
      propertyType: 'Tipo de propiedad',
      price: 'Precio',
      toggleLanguage: 'English',
    },
    en: {
      title: 'Mexico Real Estate Platform',
      subtitle: 'Find your next property in Mexico',
      search: 'Search',
      location: 'Location',
      propertyType: 'Property Type',
      price: 'Price',
      toggleLanguage: 'Español',
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{t.title}</title>
        <meta name="description" content="A modern real estate platform for Mexico" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <button 
            onClick={toggleLanguage}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {t.toggleLanguage}
          </button>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t.subtitle}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.location}</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option>Ciudad de México</option>
                  <option>Guadalajara</option>
                  <option>Monterrey</option>
                  <option>Cancún</option>
                  <option>Mérida</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.propertyType}</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option value="house">Casa</option>
                  <option value="apartment">Apartamento</option>
                  <option value="land">Terreno</option>
                  <option value="commercial">Comercial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.price}</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option>$0 - $100,000</option>
                  <option>$100,000 - $250,000</option>
                  <option>$250,000 - $500,000</option>
                  <option>$500,000+</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button type="button" className="w-full bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  {t.search}
                </button>
              </div>
            </div>
          </div>

          {/* Property listings would go here */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* This would be populated with actual listings */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Property Image</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Modern Apartment in Polanco</h3>
                <p className="mt-1 text-sm text-gray-500">2 beds • 2 baths • 120m²</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">$350,000</p>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Property Image</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Beach House in Cancún</h3>
                <p className="mt-1 text-sm text-gray-500">4 beds • 3 baths • 280m²</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">$650,000</p>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Property Image</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Colonial Home in Mérida</h3>
                <p className="mt-1 text-sm text-gray-500">3 beds • 2 baths • 220m²</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">$420,000</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 Mexico Real Estate Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
