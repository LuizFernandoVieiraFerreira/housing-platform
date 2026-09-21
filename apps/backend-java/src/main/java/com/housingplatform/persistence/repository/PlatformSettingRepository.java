package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, Short> {}
