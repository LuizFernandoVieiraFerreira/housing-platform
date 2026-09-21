package com.housingplatform.persistence.converter;

import com.housingplatform.persistence.enums.HousingRequestStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class HousingRequestStatusConverter
    implements AttributeConverter<HousingRequestStatus, String> {

  @Override
  public String convertToDatabaseColumn(HousingRequestStatus attribute) {
    return attribute == null ? null : attribute.dbValue();
  }

  @Override
  public HousingRequestStatus convertToEntityAttribute(String dbData) {
    return dbData == null ? null : HousingRequestStatus.fromDbValue(dbData);
  }
}
