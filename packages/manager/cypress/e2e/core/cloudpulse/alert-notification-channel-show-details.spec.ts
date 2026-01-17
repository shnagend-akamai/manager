/**
 * @file Integration Tests for the CloudPulse Alerts Notification Channel Show Detail Page.
 *
 * This file contains Cypress tests that validate the display and content of the  Alerts Notification channel Show Detail Page in the CloudPulse application.
 * It ensures that all alert details, criteria, and entity information are displayed correctly.
 */
import { profileFactory } from '@linode/utilities';
import { mockGetAccount } from 'support/intercepts/account';
import {
  mockGetAlertChannelById,
  mockGetAlertChannelByIdError,
  mockGetAlertChannels,
  mockGetAlertsByChannelId,
  mockGetAlertsByChannelIdError,
} from 'support/intercepts/cloudpulse';
import { mockAppendFeatureFlags } from 'support/intercepts/feature-flags';
import { mockGetProfile } from 'support/intercepts/profile';
import { ui } from 'support/ui';

import { notificationChannelAlertsFactory } from 'src/factories';
import {
  accountFactory,
  flagsFactory,
  notificationChannelFactory,
} from 'src/factories';

// Define mock data for the test.

const mockAccount = accountFactory.build();
const mockProfile = profileFactory.build({
  restricted: false,
});

const notificationChannels = notificationChannelFactory.buildList(20, {
  details: {
    email: {
      recipient_type: 'user',
      // usernames: Array.from({ length: 50 }, (_, i) => `user-${i}`),
      // usernames: Array.from({ length: 50 }, (_, i) => `verylongnametestcasecheckwithsplcharsvisibleornotorwrappingup-${i}`),
      usernames: [
        'admin-user',
        'john-doe',
        'jane-smith',
        'dev-team-lead',
        'ops-manager',
        'security-admin',
        'database-admin',
        'network-engineer',
        'support-specialist',
        'qa-tester',
      ],
    },
  },
});
describe('CloudPulse Alerting - Notification Channel Show details Validation', () => {
  beforeEach(() => {
    mockAppendFeatureFlags(flagsFactory.build());
    mockGetAccount(mockAccount);
    mockGetProfile(mockProfile);
    mockGetAlertChannels(notificationChannels).as(
      'getAlertNotificationChannels'
    );
    const mockAlerts = [
      ...notificationChannelAlertsFactory.buildList(2, {
        service_type: 'linode',
      }),
      ...notificationChannelAlertsFactory.buildList(2, {
        service_type: 'dbaas',
      }),
      ...notificationChannelAlertsFactory.buildList(2, {
        service_type: 'nodebalancer',
      }),
      ...notificationChannelAlertsFactory.buildList(1, {
        service_type: 'lke',
      }),
      ...notificationChannelAlertsFactory.buildList(1, {
        service_type: 'firewall',
      }),
      ...notificationChannelAlertsFactory.buildList(1, {
        service_type: 'objectstorage',
      }),
      ...notificationChannelAlertsFactory.buildList(1, {
        service_type: 'blockstorage',
      }),
    ];
    mockGetAlertsByChannelId(notificationChannels[1].id, mockAlerts).as(
      'getAlertsByChannelId'
    );
    mockGetAlertChannelById(
      notificationChannels[1].id,
      notificationChannels[1]
    ).as('getAlertNotificationChannelById');
    //  Visit Notification Channels page
    cy.visitWithLogin('/alerts/notification-channels');
  });
  it('should verify navigation to Alert Notification Channel Show Detail Page', () => {
    // Wait for the alert notification channels to load
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    const { id, label } = notificationChannels[1];
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelById');
    cy.wait('@getAlertsByChannelId');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
  it('should verify when get channel alerts returns 400 and 500 errors', () => {
    // Intercept the get alerts by channel id request to return a 500 error
    mockGetAlertsByChannelIdError(notificationChannels[1].id).as(
      'getAlertsByChannelIdError500'
    );
    // Select the first notification channel to edit
    const { id, label } = notificationChannels[1];
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelById');
    cy.wait('@getAlertsByChannelIdError500');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
  it('should verify when get alertchannel returns 400 error', () => {
    // Intercept the get alert channel by id request to return a 500 error
    mockGetAlertChannelByIdError(notificationChannels[1].id).as(
      'getAlertNotificationChannelByIdError500'
    );
    cy.visitWithLogin('/alerts/notification-channels');
    // Select the first notification channel to edit
    const { id, label } = notificationChannels[1];
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelByIdError500');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
  it('should verify when no response returned by get alertchannel request', () => {
    // Intercept the get alert channel by id request to return a 400 error
    mockGetAlertsByChannelId(notificationChannels[1].id, []).as(
      'getAlertNotificationChannelByIdNoResponse'
    );
    cy.visitWithLogin('/alerts/notification-channels');
    // Select the first notification channel to edit
    const { id, label } = notificationChannels[1];
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelByIdNoResponse');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
  it('should verify notificationChannels with no user recipients_type and no recipients', () => {
    const notificationChannelNoRecipients =
      notificationChannelFactory.buildList(10, {
        details: { email: { recipient_type: 'user', usernames: [''] } },
      });
    mockGetAlertChannels(notificationChannelNoRecipients).as(
      'getAlertNotificationChannels'
    );
    const { id, label } = notificationChannelNoRecipients[1];
    mockGetAlertChannelById(id, notificationChannelNoRecipients[1]).as(
      'getAlertNotificationChannelNoRecipients'
    );
    mockGetAlertsByChannelId(id, []).as('getAlertsByChannelIdNoRecipients');
    cy.visitWithLogin('/alerts/notification-channels');
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelNoRecipients');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
  it('should verify notificationChannels with long usernames list wrapping behavior', () => {
    const notificationChannellonglabel = notificationChannelFactory.buildList(
      1,
      {
        label: 'longnamerepeat123456'.repeat(5), // Exactly 100 characters
        created_by: 'longnamerepeat123456'.repeat(5),
        updated_by: 'longnamerepeat123456'.repeat(5),
        channel_type: 'email',
        details: {
          email: {
            recipient_type: 'user',
            usernames: ['abcdefghijklmnopqrstuvwxyz'],
          },
        },
      }
    );
    mockGetAlertChannels(notificationChannellonglabel).as(
      'getAlertNotificationChannels'
    );
    mockGetAlertChannelById(
      notificationChannellonglabel[0].id,
      notificationChannellonglabel[0]
    ).as('getAlertNotificationChannellonglabelById');
    const { id, label } = notificationChannellonglabel[0];
    const mockAlerts = [
      ...notificationChannelAlertsFactory.buildList(2, {
        service_type: 'linode',
      }),
      ...notificationChannelAlertsFactory.buildList(2, {
        service_type: 'dbaas',
      }),
    ];
    mockGetAlertsByChannelId(id, mockAlerts).as('getAlertListbychannelId');
    cy.visitWithLogin('/alerts/notification-channels');
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannellonglabelById');
    cy.wait('@getAlertListbychannelId');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
  it('should verify for large number of alerts associated with a notification channel', () => {
    const largeAlertList = notificationChannelAlertsFactory.buildList(500, {
      service_type: 'nodebalancer',
      // label: '',
      label: 'longnamerepeat123456'.repeat(5),
    });

    mockGetAlertsByChannelId(notificationChannels[2].id, largeAlertList).as(
      'getLargeAlertsByChannelId'
    );
    mockGetAlertChannelById(
      notificationChannels[2].id,
      notificationChannels[2]
    ).as('getAlertNotificationChannelById');
    const { id, label } = notificationChannels[2];
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelById');
    cy.wait('@getLargeAlertsByChannelId');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
  it('should verify notificationChannels with no label, no created_by and updated_by fields', () => {
    const notificationChannelNoLabel = notificationChannelFactory.buildList(1, {
      label: '1',
      created_by: '',
      updated_by: '',
      channel_type: 'email',
    });
    mockGetAlertChannels(notificationChannelNoLabel).as(
      'getAlertNotificationChannels'
    );
    const { id, label } = notificationChannelNoLabel[0];
    mockGetAlertChannelById(id, notificationChannelNoLabel[0]).as(
      'getAlertNotificationChannelNoLabel'
    );
    mockGetAlertsByChannelId(id, []).as('getAlertsByChannelIdNoLabel');
    cy.visitWithLogin('/alerts/notification-channels');
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelNoLabel');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });
});
