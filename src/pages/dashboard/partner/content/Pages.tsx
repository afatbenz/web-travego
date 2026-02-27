import React, { useState } from 'react';
import GenericContentPage from './GenericContentPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const GeneralContent = () => (
  <GenericContentPage 
    title="General Configuration" 
    description="Configure general settings for your content."
    parent="general-config"
    initialSections={[
      { id: 1, name: 'Brand Name', description: 'Name of your brand', section_tag: 'brand-name', status: 'Checking...', lastUpdated: '-', type: 'text' },
      { id: 2, name: 'Company Name', description: 'Legal company name', section_tag: 'company-name', status: 'Checking...', lastUpdated: '-', type: 'text' },
      { id: 3, name: 'Brand Description', description: 'Short description of your brand', section_tag: 'brand-description', status: 'Checking...', lastUpdated: '-', type: 'text' },
      { id: 4, name: 'Brand Logo', description: 'Logo image of your brand', section_tag: 'brand-logo', status: 'Checking...', lastUpdated: '-', type: 'image' },
      { id: 5, name: 'Social Media', description: 'Social media links', section_tag: 'social-media', status: 'Checking...', lastUpdated: '-', type: 'list' },
      { id: 6, name: 'Contact', description: 'Contact information', section_tag: 'contact', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);

export const ImageSliderContent = () => (
  <GenericContentPage 
    title="Image Sliders" 
    description="Manage image sliders and banners."
    parent="image-slider"
    initialSections={[
      { id: 1, name: 'Main Banner Slider', description: 'Images for the main banner slider', section_tag: 'main-banner', status: 'Checking...', lastUpdated: '-', type: 'image' }
    ]}
  />
);

export const CatalogueContent = () => (
  <GenericContentPage 
    title="Catalogue & Product" 
    description="Manage your product catalogue."
    parent="catalogue"
    initialSections={[
      { id: 1, name: 'Product List', description: 'List of products in the catalogue', section_tag: 'product-list', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);

export const HotOffersContent = () => (
  <GenericContentPage 
    title="Promo and Hot Offers" 
    description="Manage promotions and hot offers."
    parent="hot-offers"
    initialSections={[
      { id: 1, name: 'Hot Offers', description: 'List of hot offers and promotions', section_tag: 'hot-offers-main', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);

export const ServicesContent = () => (
  <GenericContentPage 
    title="Services" 
    description="Manage service descriptions."
    parent="servicces"
    initialSections={[
      { id: 1, name: 'Main Services', description: 'List of main services offered', section_tag: 'services-main', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);

export const TeamContent: React.FC = () => {
  const [members] = useState<Array<{
    id: number;
    name: string;
    division: string;
    jobdesc: string;
    join_year: number;
    photo: string;
  }>>([
    {
      id: 1,
      name: 'Ahmad Rizki',
      division: 'Operations',
      jobdesc: 'Koordinator Operasional',
      join_year: 2021,
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Siti Nurhaliza',
      division: 'Marketing',
      jobdesc: 'Spesialis Konten',
      join_year: 2020,
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Budi Santoso',
      division: 'Finance',
      jobdesc: 'Analis Keuangan',
      join_year: 2019,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 4,
      name: 'Dewi Kartika',
      division: 'Operations',
      jobdesc: 'Supervisor Lapangan',
      join_year: 2022,
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tim</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Tampilkan daftar anggota tim organisasi.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Tambah anggota tim
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota Tim</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Belum ada anggota tim.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Jobdesc</TableHead>
                  <TableHead>Tahun Join</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <img src={m.photo} alt={m.name} className="h-10 w-10 rounded-full object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.division}</TableCell>
                    <TableCell>{m.jobdesc}</TableCell>
                    <TableCell>{m.join_year}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const ContactContent = () => (
  <GenericContentPage 
    title="Contact" 
    description="Manage contact information."
    parent="contact"
    initialSections={[
      { id: 1, name: 'Contact Info', description: 'Detailed contact information', section_tag: 'contact-info', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);

export const WhyChooseUsContent = () => (
  <GenericContentPage 
    title="Why Choose Us" 
    description="Manage why choose us section."
    parent="choose-use"
    initialSections={[
      { id: 1, name: 'Why Choose Us Points', description: 'Points explaining why to choose us', section_tag: 'why-choose-us-points', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);

export const SocialMediaContent = () => (
  <GenericContentPage 
    title="Social Media" 
    description="Manage social media links."
    parent="social-media"
    initialSections={[
      { id: 1, name: 'Social Media Links', description: 'Links to social media profiles', section_tag: 'social-media', status: 'Checking...', lastUpdated: '-', type: 'social-media' }
    ]}
  />
);

export { BankAccountContent } from './BankAccount';
