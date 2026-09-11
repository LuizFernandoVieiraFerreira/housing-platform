import { Card, PageHeader } from '@housing-platform/ui';

import { ProfileForm } from '@/features/account/components/ProfileForm';

export function ProfilePage() {
  return (
    <Card>
      <PageHeader
        title="Profile"
        description="Update the information hosts and support can use to help with your stay."
      />

      <div className="mt-8">
        <ProfileForm />
      </div>
    </Card>
  );
}
