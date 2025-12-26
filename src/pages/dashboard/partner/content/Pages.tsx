import GenericContentPage from './GenericContentPage';

export const GeneralContent = () => (
  <GenericContentPage 
    title="General Configuration" 
    description="Configure general settings for your content."
    initialSections={[
      { id: 1, name: 'General Settings', section_tag: 'general-settings', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const ImageSliderContent = () => (
  <GenericContentPage 
    title="Image Sliders" 
    description="Manage image sliders and banners."
    initialSections={[
      { id: 1, name: 'Main Banner Slider', section_tag: 'main-banner', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const CatalogueContent = () => (
  <GenericContentPage 
    title="Catalogue & Product" 
    description="Manage your product catalogue."
    initialSections={[
      { id: 1, name: 'Product List', section_tag: 'product-list', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const HotOffersContent = () => (
  <GenericContentPage 
    title="Promo and Hot Offers" 
    description="Manage promotions and hot offers."
    initialSections={[
      { id: 1, name: 'Hot Offers', section_tag: 'hot-offers-main', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const ServicesContent = () => (
  <GenericContentPage 
    title="Services" 
    description="Manage service descriptions."
    initialSections={[
      { id: 1, name: 'Main Services', section_tag: 'services-main', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const TeamContent = () => (
  <GenericContentPage 
    title="Team" 
    description="Manage team member profiles."
    initialSections={[
      { id: 1, name: 'Management Team', section_tag: 'team-management', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const ContactContent = () => (
  <GenericContentPage 
    title="Contact" 
    description="Manage contact information."
    initialSections={[
      { id: 1, name: 'Contact Info', section_tag: 'contact-info', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const WhyChooseUsContent = () => (
  <GenericContentPage 
    title="Why Choose Us" 
    description="Manage why choose us section."
    initialSections={[
      { id: 1, name: 'Why Choose Us Points', section_tag: 'why-choose-us-points', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const SocialMediaContent = () => (
  <GenericContentPage 
    title="Social Media" 
    description="Manage social media links."
    initialSections={[
      { id: 1, name: 'Social Media Links', section_tag: 'social-media', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);

export const BankAccountContent = () => (
  <GenericContentPage 
    title="Bank Account" 
    description="Manage bank account details."
    initialSections={[
      { id: 1, name: 'Bank Accounts', section_tag: 'bank-accounts', status: 'Checking...', lastUpdated: '-' }
    ]}
  />
);
