package com.housingplatform.config;

import javax.sql.DataSource;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

@Configuration
@Order(Ordered.LOWEST_PRECEDENCE)
public class PgvectorConfig implements BeanPostProcessor {

  @Override
  public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
    if (!"dataSource".equals(beanName) || bean instanceof PgvectorDataSource) {
      return bean;
    }

    if (bean instanceof DataSource dataSource) {
      return new PgvectorDataSource(dataSource);
    }

    return bean;
  }
}
