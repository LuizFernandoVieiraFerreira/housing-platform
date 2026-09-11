import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  getInitials,
} from '@housing-platform/ui';
import { Link, useNavigate } from 'react-router-dom';

import { useCurrentProfile } from '@/features/account/hooks/useProfile';
import { isAdminProfile } from '@/features/admin/api/admin-api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isHostProfile } from '@/features/host/api/host-api';

export function UserAvatarMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentProfile(user?.id);
  const isHost = isHostProfile(profile?.role);
  const isAdmin = isAdminProfile(profile?.role);

  const handleSignOut = async () => {
    await signOut();
    if (isAdmin) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (profile?.role === 'host') {
      navigate('/host/login', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  };

  const initials = getInitials(profile?.full_name, user?.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full focus-visible:outline-none"
        >
          <Avatar>
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuHeader>
          <p className="text-ink text-sm font-semibold">{profile?.full_name ?? 'Account'}</p>
          <p className="text-ink-muted truncate text-xs">{user?.email}</p>
        </DropdownMenuHeader>

        <DropdownMenuItem asChild>
          <Link to="/account">Account</Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin">Admin</Link>
          </DropdownMenuItem>
        ) : null}
        {isHost && !isAdmin ? (
          <>
            <DropdownMenuItem asChild>
              <Link to="/host">Host portal</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/host/bookings">Bookings</Link>
            </DropdownMenuItem>
          </>
        ) : null}
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin/bookings">Bookings</Link>
          </DropdownMenuItem>
        ) : null}
        {!isHost ? (
          <>
            <DropdownMenuItem asChild>
              <Link to="/bookings">Bookings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/host/register">Become a host</Link>
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start px-0"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </DropdownMenuFooter>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
