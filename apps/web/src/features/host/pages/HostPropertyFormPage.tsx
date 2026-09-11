import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, CardDescription, CardHeader, CardTitle, FormField, Input, PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@housing-platform/ui';
import type { HostPropertyDetail } from '@housing-platform/types';
import {
  hostPropertySchema,
  hostRoomSchema,
  type HostPropertyInput,
  type HostRoomInput,
} from '@housing-platform/validation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getAuthErrorMessage } from '@/features/auth/lib/auth-utils';
import { formatKrw } from '@/features/booking/lib/booking-utils';
import {
  useAmenities,
  useCreateHostProperty,
  useCreateHostRoom,
  useDeleteHostRoom,
  useHostProperty,
  useSubmitHostProperty,
  useUpdateHostProperty,
} from '@/features/host/hooks/useHost';
import { geocodeAddress, getNaverMapClientId } from '@/shared/lib/naver-maps';

function toPropertyFormValues(property: HostPropertyDetail): HostPropertyInput {
  return {
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2 ?? '',
    city: property.city,
    postalCode: property.postalCode ?? '',
    district: property.district,
    nearestStationName: property.nearestStationName ?? '',
    nearestStationWalkMin: property.nearestStationWalkMin ?? '',
    bookingMode: property.bookingMode,
    minStayNights: property.minStayNights,
    tags: property.tags.join(', '),
    amenityIds: property.amenityIds,
    latitude: property.latitude ?? undefined,
    longitude: property.longitude ?? undefined,
  };
}

export function HostPropertyFormPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(propertyId);
  const { data: property, isLoading } = useHostProperty(propertyId);
  const { data: amenities } = useAmenities();
  const createProperty = useCreateHostProperty();
  const updateProperty = useUpdateHostProperty(propertyId ?? '');
  const createRoom = useCreateHostRoom(propertyId ?? '');
  const deleteRoom = useDeleteHostRoom(propertyId ?? '');
  const submitProperty = useSubmitHostProperty(propertyId ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);

  const propertyForm = useForm<HostPropertyInput>({
    resolver: zodResolver(hostPropertySchema),
    defaultValues: {
      title: '',
      description: '',
      propertyType: 'studio',
      addressLine1: '',
      addressLine2: '',
      city: 'Seoul',
      postalCode: '',
      district: '',
      nearestStationName: '',
      nearestStationWalkMin: '',
      bookingMode: 'request',
      minStayNights: 30,
      tags: '',
      amenityIds: [],
    },
  });

  const roomForm = useForm<HostRoomInput>({
    resolver: zodResolver(hostRoomSchema),
    defaultValues: {
      name: '',
      roomType: '',
      sizeSqm: '',
      maxOccupancy: 1,
      monthlyPriceKrw: 700000,
      availableFrom: '',
    },
  });

  useEffect(() => {
    if (!property) {
      return;
    }

    propertyForm.reset(toPropertyFormValues(property));
  }, [property, propertyForm]);

  const handleGeocode = async () => {
    setFormError(null);
    setGeocodeMessage(null);

    const address = [
      propertyForm.getValues('addressLine1'),
      propertyForm.getValues('addressLine2'),
      propertyForm.getValues('city'),
    ]
      .filter(Boolean)
      .join(', ');

    if (!address.trim()) {
      setFormError('Enter an address before geocoding.');
      return;
    }

    if (!getNaverMapClientId()) {
      setFormError('Set VITE_NAVER_MAP_CLIENT_ID to geocode addresses locally.');
      return;
    }

    try {
      const result = await geocodeAddress(address);

      if (!result) {
        setFormError('No coordinates found for that address.');
        return;
      }

      propertyForm.setValue('latitude', result.latitude);
      propertyForm.setValue('longitude', result.longitude);
      if (!propertyForm.getValues('district')) {
        propertyForm.setValue('district', result.district);
      }
      setGeocodeMessage(`Location set: ${result.roadAddress}`);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to geocode address.'));
    }
  };

  const saveProperty = propertyForm.handleSubmit(async (values) => {
    setFormError(null);

    try {
      if (isEditing) {
        await updateProperty.mutateAsync(values);
        return;
      }

      const newPropertyId = await createProperty.mutateAsync(values);
      navigate(`/host/properties/${newPropertyId}`, { replace: true });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to save property.'));
    }
  });

  const handleAddRoom = roomForm.handleSubmit(async (values) => {
    setFormError(null);

    if (!propertyId) {
      setFormError('Save the property before adding rooms.');
      return;
    }

    try {
      await createRoom.mutateAsync(values);
      roomForm.reset({
        name: '',
        roomType: '',
        sizeSqm: '',
        maxOccupancy: 1,
        monthlyPriceKrw: 700000,
        availableFrom: '',
      });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to add room.'));
    }
  });

  const handleSubmitForReview = async () => {
    setFormError(null);

    if (!propertyId) {
      setFormError('Save the property before submitting for review.');
      return;
    }

    try {
      await submitProperty.mutateAsync();
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Unable to submit for review.'));
    }
  };

  if (isEditing && isLoading) {
    return <p className="text-ink-muted text-sm">Loading property...</p>;
  }

  if (isEditing && !property) {
    return <Alert variant="error">Property not found.</Alert>;
  }

  const latitude = propertyForm.watch('latitude');
  const longitude = propertyForm.watch('longitude');
  const selectedAmenities = propertyForm.watch('amenityIds') ?? [];

  return (
    <div className="space-y-8">
      <Card>
        <Link to="/host/properties" className="text-brand-600 text-sm font-medium hover:underline">
          ← Back to properties
        </Link>
        <PageHeader
          className="mt-4 items-start sm:items-start"
          title={isEditing ? 'Edit listing' : 'Create listing'}
        />

        <form className="mt-8 space-y-5" onSubmit={(event) => void saveProperty(event)} noValidate>
          <FormField
            label="Title"
            htmlFor="title"
            error={propertyForm.formState.errors.title?.message}
          >
            <Input
              id="title"
              hasError={Boolean(propertyForm.formState.errors.title)}
              {...propertyForm.register('title')}
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="description"
            error={propertyForm.formState.errors.description?.message}
          >
            <Textarea
              id="description"
              hasError={Boolean(propertyForm.formState.errors.description)}
              {...propertyForm.register('description')}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Property type"
              htmlFor="propertyType"
              error={propertyForm.formState.errors.propertyType?.message}
            >
              <Controller
                name="propertyType"
                control={propertyForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="propertyType"
                      className="w-full"
                      hasError={Boolean(propertyForm.formState.errors.propertyType)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="share-house">Share-house</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="micro-studio">Micro Studio</SelectItem>
                      <SelectItem value="multi-bedroom">Multi-bedroom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              label="Booking mode"
              htmlFor="bookingMode"
              error={propertyForm.formState.errors.bookingMode?.message}
            >
              <Controller
                name="bookingMode"
                control={propertyForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="bookingMode"
                      className="w-full"
                      hasError={Boolean(propertyForm.formState.errors.bookingMode)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant book</SelectItem>
                      <SelectItem value="request">Request to book</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <FormField
            label="Address line 1"
            htmlFor="addressLine1"
            error={propertyForm.formState.errors.addressLine1?.message}
          >
            <Input id="addressLine1" {...propertyForm.register('addressLine1')} />
          </FormField>

          <FormField label="Address line 2" htmlFor="addressLine2">
            <Input id="addressLine2" {...propertyForm.register('addressLine2')} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="City"
              htmlFor="city"
              error={propertyForm.formState.errors.city?.message}
            >
              <Input id="city" {...propertyForm.register('city')} />
            </FormField>
            <FormField
              label="District"
              htmlFor="district"
              error={propertyForm.formState.errors.district?.message}
            >
              <Input id="district" {...propertyForm.register('district')} />
            </FormField>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Button type="button" variant="secondary" onClick={() => void handleGeocode()}>
              Geocode address
            </Button>
            {latitude != null && longitude != null ? (
              <p className="text-ink-muted text-sm">
                Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            ) : (
              <p className="text-ink-muted text-sm">Location not set</p>
            )}
          </div>

          {geocodeMessage ? <Alert variant="success">{geocodeMessage}</Alert> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Nearest station" htmlFor="nearestStationName">
              <Input id="nearestStationName" {...propertyForm.register('nearestStationName')} />
            </FormField>
            <FormField label="Walk minutes" htmlFor="nearestStationWalkMin">
              <Input
                id="nearestStationWalkMin"
                type="number"
                min={1}
                {...propertyForm.register('nearestStationWalkMin')}
              />
            </FormField>
          </div>

          <FormField label="Minimum stay (nights)" htmlFor="minStayNights">
            <Input
              id="minStayNights"
              type="number"
              min={1}
              {...propertyForm.register('minStayNights')}
            />
          </FormField>

          <FormField label="Tags (comma separated)" htmlFor="tags">
            <Input
              id="tags"
              placeholder="featured, near campus"
              {...propertyForm.register('tags')}
            />
          </FormField>

          {amenities?.length ? (
            <div>
              <p className="text-ink mb-2 block text-sm font-medium">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => {
                  const checked = selectedAmenities.includes(amenity.id);

                  return (
                    <label
                      key={amenity.id}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                        checked
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-surface-subtle text-ink-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selectedAmenities, amenity.id]
                            : selectedAmenities.filter((id) => id !== amenity.id);
                          propertyForm.setValue('amenityIds', next);
                        }}
                      />
                      {amenity.name}
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={createProperty.isPending || updateProperty.isPending}>
              {isEditing ? 'Save changes' : 'Create draft listing'}
            </Button>
            {isEditing && property?.status === 'draft' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleSubmitForReview()}
                disabled={submitProperty.isPending}
              >
                {submitProperty.isPending ? 'Submitting...' : 'Submit for review'}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {isEditing && property ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Rooms</CardTitle>
            <CardDescription>Add at least one room before submitting for review.</CardDescription>
          </CardHeader>

          <div className="mt-6 space-y-3">
            {property.rooms.map((room) => (
              <div
                key={room.id}
                className="border-surface-subtle flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="text-ink font-medium">{room.name}</p>
                  <p className="text-ink-muted text-sm">
                    {formatKrw(room.monthlyPriceKrw)}/30 days · up to {room.maxOccupancy} guest
                    {room.maxOccupancy === 1 ? '' : 's'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void deleteRoom.mutateAsync(room.id)}
                  disabled={deleteRoom.isPending}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <form
            className="mt-8 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => void handleAddRoom(event)}
            noValidate
          >
            <FormField
              label="Room name"
              htmlFor="roomName"
              error={roomForm.formState.errors.name?.message}
            >
              <Input id="roomName" {...roomForm.register('name')} />
            </FormField>
            <FormField
              label="Monthly price (KRW)"
              htmlFor="monthlyPriceKrw"
              error={roomForm.formState.errors.monthlyPriceKrw?.message}
            >
              <Input
                id="monthlyPriceKrw"
                type="number"
                min={100000}
                {...roomForm.register('monthlyPriceKrw')}
              />
            </FormField>
            <FormField
              label="Max occupancy"
              htmlFor="maxOccupancy"
              error={roomForm.formState.errors.maxOccupancy?.message}
            >
              <Input
                id="maxOccupancy"
                type="number"
                min={1}
                {...roomForm.register('maxOccupancy')}
              />
            </FormField>
            <FormField label="Room type" htmlFor="roomType">
              <Input id="roomType" {...roomForm.register('roomType')} />
            </FormField>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createRoom.isPending}>
                {createRoom.isPending ? 'Adding room...' : 'Add room'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
