package com.housingplatform.persistence.converter;

import com.housingplatform.persistence.enums.AccommodationType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class AccommodationTypeConverter implements AttributeConverter<AccommodationType, String> {

  @Override
  public String convertToDatabaseColumn(AccommodationType attribute) {
    return attribute == null ? null : attribute.dbValue();
  }

  @Override
  public AccommodationType convertToEntityAttribute(String dbData) {
    return dbData == null ? null : AccommodationType.fromDbValue(dbData);
  }
}
