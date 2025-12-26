import GenericContentPage from './GenericContentPage';

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

export const TeamContent = () => (
  <GenericContentPage 
    title="Team" 
    description="Manage team member profiles."
    parent="team"
    initialSections={[
      { id: 1, name: 'Management Team', description: 'List of management team members', section_tag: 'team-management', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);

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

export const BankAccountContent = () => (
  <GenericContentPage 
    title="Bank Account" 
    description="Manage bank account details."
    parent="bank-account"
    initialSections={[
      { id: 1, name: 'Bank Accounts', description: 'List of bank accounts', section_tag: 'bank-accounts', status: 'Checking...', lastUpdated: '-', type: 'list' }
    ]}
  />
);
