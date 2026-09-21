package com.housingplatform.persistence.entity;

import com.housingplatform.persistence.converter.PGvectorConverter;
import com.pgvector.PGvector;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "property_search_embeddings", schema = "public")
public class PropertySearchEmbedding {

  @Id
  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @MapsId
  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "property_id", nullable = false)
  private Property property;

  @Column(name = "content", nullable = false)
  private String content;

  @Column(name = "content_hash", nullable = false)
  private String contentHash;

  @Convert(converter = PGvectorConverter.class)
  @Column(name = "embedding", nullable = false, columnDefinition = "vector(1536)")
  private PGvector embedding;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected PropertySearchEmbedding() {}

  public UUID getPropertyId() {
    return propertyId;
  }

  public Property getProperty() {
    return property;
  }

  public String getContent() {
    return content;
  }

  public String getContentHash() {
    return contentHash;
  }

  public PGvector getEmbedding() {
    return embedding;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
