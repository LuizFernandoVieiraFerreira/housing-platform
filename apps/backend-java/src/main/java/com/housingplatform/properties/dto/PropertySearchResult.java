package com.housingplatform.properties.dto;

import java.util.List;

public record PropertySearchResult(List<SearchPropertyCard> items, int totalCount) {}
