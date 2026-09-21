package com.housingplatform.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "room_images", schema = "public")
public class RoomImage {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "room_id", nullable = false, insertable = false, updatable = false)
  private UUID roomId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "room_id", nullable = false)
  private Room room;

  @Column(name = "storage_path", nullable = false)
  private String storagePath;

  @Column(name = "alt_text")
  private String altText;

  @Column(name = "sort_order", nullable = false)
  private int sortOrder;

  @Column(name = "is_cover", nullable = false)
  private boolean cover;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected RoomImage() {}

  public UUID getId() {
    return id;
  }

  public UUID getRoomId() {
    return roomId;
  }

  public Room getRoom() {
    return room;
  }

  public String getStoragePath() {
    return storagePath;
  }

  public String getAltText() {
    return altText;
  }

  public int getSortOrder() {
    return sortOrder;
  }

  public boolean isCover() {
    return cover;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
