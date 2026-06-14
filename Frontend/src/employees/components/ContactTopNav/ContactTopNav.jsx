import React from 'react';
import TopTabs from '../TopTabs/TopTabs';

const tabs = ['All', 'General Contractors', 'Vendors'];

function ContactTopNav({ activeTab = 'All', onTabChange }) {
  return <TopTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />;
}

export default ContactTopNav;