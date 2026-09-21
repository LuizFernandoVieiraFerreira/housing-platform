package com.housingplatform.persistence.converter;

import com.pgvector.PGvector;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.sql.SQLException;

@Converter(autoApply = false)
public class PGvectorConverter implements AttributeConverter<PGvector, Object> {

  @Override
  public Object convertToDatabaseColumn(PGvector attribute) {
    return attribute;
  }

  @Override
  public PGvector convertToEntityAttribute(Object dbData) {
    if (dbData == null) {
      return null;
    }
    if (dbData instanceof PGvector pgvector) {
      return pgvector;
    }
    try {
      return new PGvector(dbData.toString());
    } catch (SQLException ex) {
      throw new IllegalStateException("Unable to parse pgvector value", ex);
    }
  }
}
