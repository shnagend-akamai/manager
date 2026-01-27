import { profileFactory } from '@linode/utilities';
/**
 * @file Integration Tests for the CloudPulse Alerts Notification Channel Show Detail Page.
 *
 * This file contains Cypress tests that validate the display and content of the  Alerts Notification channel Show Detail Page in the CloudPulse application.
 * It ensures that all alert details, criteria, and entity information are displayed correctly.
 */
import { cloudPulseServiceMap } from 'support/constants/cloudpulse';
import { mockGetAccount } from 'support/intercepts/account';
import {
  mockGetAlertChannelById,
  mockGetAlertChannelByIdError,
  mockGetAlertChannels,
  mockGetAlertsForChannelId,
  mockGetAlertsForChannelIdError,
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
import { formatDate } from 'src/utilities/formatDate';

// Define mock data for the test.

const mockAccount = accountFactory.build();
const mockProfile = profileFactory.build({
  restricted: false,
  timezone: 'gmt',
});

const notificationChannelDetails = notificationChannelFactory.buildList(1, {
  label: 'Notification channel 1',
  channel_type: 'email',
  type: 'user',
  details: {
    email: {
      recipient_type: 'user',
      usernames: ['admin-user', 'john-doe', 'jane-smith'],
    },
  },
  created_by: 'user1',
  updated_by: 'user2',
  created: '2026-01-27T06:18:00Z',
  // created: '2026-01-26T12:00:00Z',
  updated: new Date().toISOString(),
});
const {
  label,
  id,
  type,
  channel_type,
  details,
  created_by,
  created,
  updated,
  updated_by,
} = notificationChannelDetails[0];

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
  ...notificationChannelAlertsFactory.buildList(2, {
    service_type: 'lke',
  }),
  ...notificationChannelAlertsFactory.buildList(2, {
    service_type: 'firewall',
  }),
  ...notificationChannelAlertsFactory.buildList(2, {
    service_type: 'objectstorage',
  }),
  ...notificationChannelAlertsFactory.buildList(2, {
    service_type: 'blockstorage',
  }),
];

describe('CloudPulse Alerting - Notification Channel Show details Validation', () => {
  beforeEach(() => {
    mockAppendFeatureFlags(flagsFactory.build());
    mockGetAccount(mockAccount);
    mockGetProfile(mockProfile);
    mockGetAlertChannels(notificationChannelDetails).as(
      'getAlertNotificationChannels'
    );
    mockGetAlertChannelById(id, notificationChannelDetails[0]).as(
      'getAlertNotificationChannelbyId'
    );
    mockGetAlertsForChannelId(id, mockAlerts).as('getAlertsForChannelId');
    cy.visitWithLogin('/alerts/notification-channels');
  });

  it('should display correct notification channel details', () => {
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyId');
    cy.wait('@getAlertsForChannelId');

    // Verify breadcrumb heading
    ui.breadcrumb.find().within(() => {
      cy.contains('Notification Channels').should('be.visible');
      cy.contains('Details').should('be.visible');
    });
    // Verify url correctness
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);

    // Verify details are displayed correctly
    // Validating contents of Overview Section
    cy.get('[data-qa-section="Overview"]').within(() => {
      // Validate Name field
      cy.findByText('Name:').should('be.visible');
      cy.findByText(label).should('be.visible');

      // Validate Description field
      cy.findByText('Channel Type:').should('be.visible');
      cy.findByText(
        channel_type[0].toUpperCase() + channel_type.slice(1)
      ).should('be.visible');

      // Validate Created By field
      cy.findByText('Created by:').should('be.visible');
      cy.findByText(created_by).should('be.visible');

      // Validate Created Time field
      cy.findByText('Creation Time:').should('be.visible');

      cy.findByText(
        formatDate(created, {
          format: 'MMM dd, yyyy, h:mm a',
          timezone: 'GMT',
        })
      ).should('be.visible');

      // Validate Last Modified field
      cy.findByText('Last Modified:').should('be.visible');

      cy.findByText(
        formatDate(updated, {
          format: 'MMM dd, yyyy, h:mm a',
          timezone: 'GMT',
        })
      ).should('be.visible');

      cy.findByText('Last Modified by:').should('be.visible');
      cy.findByText(updated_by).should('be.visible');
    });
    cy.get('[data-qa-section="Details"]').within(() => {
      // Validate Recipient type field
      cy.findByText('Recipient Type:').should('be.visible');
      cy.get('[data-qa-chip="user"]').should('have.text', type);

      // Validate Recipients field
      if (channel_type === 'email' && details && 'email' in details) {
        const usernames = details.email.usernames;
        usernames.forEach((username) => {
          cy.get(`[data-qa-chip="${username}"]`)
            .should('have.text', username)
            .should('be.visible');
        });
      }
    });

    cy.get('[data-qa-section="Associated Alerts"]').within(() => {
      // Validate for search box
      cy.findByPlaceholderText('Search for Alerts').should('be.visible');

      // Validate for search a service type
      cy.findByPlaceholderText('Select a Service').should('be.visible');

      const expectedHeaders = ['Alert Name', 'Service'];

      // Validate table headers
      cy.get('[data-qa="associated-alerts-table"]').within(() => {
        expectedHeaders.forEach((header) => {
          cy.findByText(header).should('have.text', header);
        });
      });

      // Validate alert details
      mockAlerts.forEach((alert) => {
        cy.get(`[data-qa-alert-cell="${alert.id}"]`).within(() => {
          cy.contains(cloudPulseServiceMap[alert.service_type])
            .should('be.visible')
            .and(
              'have.text',
              `${cloudPulseServiceMap[alert.service_type]}beta`
            );
        });
      });
    });
  });

  it('should verify search and sort functionality in Associated Alerts table', () => {
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyId');
    cy.wait('@getAlertsForChannelId');
    cy.get('[data-qa-section="Associated Alerts"]').within(() => {
      cy.findByPlaceholderText('Search for Alerts').as('searchInput');
      cy.get('@searchInput').clear();
      cy.get('@searchInput').type(mockAlerts[0].label);
      cy.get('[data-qa="associated-alerts-table"]')
        .find('tbody')
        .last()
        .within(() => {
          // Dynamically get the length based on filtered results
          const filteredAlertslen = mockAlerts.filter((alert) =>
            alert.label
              .toLowerCase()
              .includes(mockAlerts[0].label.toLowerCase())
          ).length;
          cy.get('tr').should('have.length', filteredAlertslen);
          cy.get(`[data-qa-alert-cell="${mockAlerts[0].id}"]`).should(
            'be.visible'
          );
        });
      cy.get('@searchInput').clear();
      // Validate for search a service type
      cy.findByPlaceholderText('Select a Service').as('searchServiceType');
      cy.get('@searchServiceType').clear();
      cy.get('@searchServiceType').type('Databases{enter}');

      // Verify that the table displays only alerts related to 'dbaas' service type
      const dbaasAlerts = mockAlerts.filter(
        (alert) => alert.service_type === 'dbaas'
      );
      cy.get('[data-qa="associated-alerts-table"]')
        .find('tbody')
        .last()
        .within(() => {
          cy.get('tr').should('have.length', dbaasAlerts.length);
          dbaasAlerts.forEach((alert) => {
            cy.get(`[data-qa-alert-cell="${alert.id}"]`).should('be.visible');
          });
        });

      // Clear the service filter by clicking the delete icon on the chip
      cy.contains('.MuiChip-label', 'Databases')
        .parent()
        .find('.MuiChip-deleteIcon')
        .click();

      // Validate the sorting functionality for Alert Name
      cy.get('[data-qa="associated-alerts-table"]').within(() => {
        // Click on the 'Alert Name' header to sort in descending order
        ui.heading.findByText('label').click();

        // Verify descending sort order
        ui.heading
          .findByText('label')
          .should('have.attr', 'aria-sort', 'descending');

        // Sort the mock alerts by label in descending order
        const sortedAlertsDesc = [...mockAlerts].sort((a, b) =>
          b.label.localeCompare(a.label)
        );

        // Verify that the table rows are in descending order
        cy.get('[data-qa-alert-cell]').should(($cells) => {
          const actualOrder = $cells
            .map((_, cell) =>
              parseInt(
                cell
                  .getAttribute('data-qa-alert-cell')
                  ?.replace('table-row-', '') || '0',
                10
              )
            )
            .get();
          sortedAlertsDesc.forEach((alert, index) => {
            expect(actualOrder[index]).to.equal(alert.id);
          });
        });

        // Click again to sort in ascending order
        ui.heading.findByText('label').click();
        ui.heading
          .findByText('label')
          .should('have.attr', 'aria-sort', 'ascending');

        // Sort the mock alerts by label in ascending order
        const sortedAlertsAsc = [...mockAlerts].sort((a, b) =>
          a.label.localeCompare(b.label)
        );

        // Verify that the table rows are in ascending order
        cy.get('[data-qa-alert-cell]').should(($cells) => {
          const actualOrder = $cells
            .map((_, cell) =>
              parseInt(
                cell
                  .getAttribute('data-qa-alert-cell')
                  ?.replace('table-row-', '') || '0',
                10
              )
            )
            .get();
          sortedAlertsAsc.forEach((alert, index) => {
            expect(actualOrder[index]).to.equal(alert.id);
          });
        });
      });

      // Validate the sorting functionality for service Type
      cy.get('[data-qa="associated-alerts-table"]').within(() => {
        // Click on the 'Service' header to sort in descending order
        ui.heading.findByText('service_type_label').click();

        // Verify descending sort order
        ui.heading
          .findByText('service_type_label')
          .should('have.attr', 'aria-sort', 'descending');

        // Sort the mock alerts by service type in descending order
        const sortedServiceTypeDesc = [...mockAlerts].sort((a, b) =>
          cloudPulseServiceMap[b.service_type].localeCompare(
            cloudPulseServiceMap[a.service_type]
          )
        );
        // Verify that the table rows are in descending order
        cy.get('[data-qa-alert-cell]').should(($cells) => {
          const actualOrder = $cells
            .map((_, cell) =>
              parseInt(
                cell
                  .getAttribute('data-qa-alert-cell')
                  ?.replace('table-row-', '') || '0',
                10
              )
            )
            .get();
          sortedServiceTypeDesc.forEach((alert, index) => {
            expect(actualOrder[index]).to.equal(alert.id);
          });
        });

        // Click again to sort in ascending order
        ui.heading.findByText('service_type_label').click();
        ui.heading
          .findByText('service_type_label')
          .should('have.attr', 'aria-sort', 'ascending');

        // Sort the mock alerts by service type in ascending order
        const sortedServiceTypeAsc = [...mockAlerts].sort((a, b) =>
          cloudPulseServiceMap[a.service_type].localeCompare(
            cloudPulseServiceMap[b.service_type]
          )
        );

        // Verify that the table rows are in ascending order
        cy.get('[data-qa-alert-cell]').should(($cells) => {
          const actualOrder = $cells
            .map((_, cell) =>
              parseInt(
                cell
                  .getAttribute('data-qa-alert-cell')
                  ?.replace('table-row-', '') || '0',
                10
              )
            )
            .get();
          sortedServiceTypeAsc.forEach((alert, index) => {
            expect(actualOrder[index]).to.equal(alert.id);
          });
        });
      });
    });
  });

  it('should verify the pagination functionality in Associated Alerts table', () => {
    cy.wait('@getAlertNotificationChannels');
    mockAlerts.push(
      ...notificationChannelAlertsFactory.buildList(25, {
        service_type: 'linode',
      })
    );
    mockGetAlertsForChannelId(id, mockAlerts).as('getAlertsForChannelId');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyId');
    cy.wait('@getAlertsForChannelId');
    cy.get('[data-qa-section="Associated Alerts"]').within(() => {
      // Verify the initial state of the page size
      ui.pagination.findPageSizeSelect().click();

      // Verify the page size options are visible
      cy.get('[data-qa-pagination-page-size-option="25"]')
        .should('exist')
        .click();

      const pages = [1, 2];

      // Confirm that pagination controls list exactly 2 pages.
      ui.pagination
        .findControls()
        .should('be.visible')
        .within(() => {
          pages.forEach((page: number) =>
            cy.findByText(`${page}`).should('be.visible')
          );
          cy.findByText('3').should('not.exist');
        });

      // Validate pagination from length of mockAlerts (26 total: page 1 has 25, page 2 has 1)
      pages.forEach((page: number) => {
        const pageSize = 25;
        const startIndex = pageSize * (page - 1);
        const endIndex = Math.min(pageSize * page, mockAlerts.length);
        const alertSubset = mockAlerts.slice(startIndex, endIndex);
        const expectedRowCount = alertSubset.length + 1; // +1 for header row

        ui.pagination.findControls().within(() => {
          cy.findByText(`${page}`).should('be.visible').click();
        });

        // Verify the correct number of rows (alerts + header)
        cy.get('[data-qa="associated-alerts-table"]')
          .find('tr')
          .should('have.length', expectedRowCount);
      });
      // Change pagination page size to 100
      ui.pagination.findPageSizeSelect().click();

      cy.get('[data-qa-pagination-page-size-option="100"]')
        .should('exist')
        .click();
    });
  });

  it('should display appropriate message when associated alerts call fails with 500', () => {
    mockGetAlertsForChannelIdError(notificationChannelDetails[0].id).as(
      'getAlertsForChannelIdError500'
    );
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyId');
    cy.wait('@getAlertsForChannelIdError500');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
    // Verify that the appropriate message is displayed
    cy.get('[data-qa-section="Associated Alerts"]').within(() => {
      cy.findByText('Error in fetching the alerts.').should('be.visible');
    });
  });

  it('should display appropriate message when no alerts are associated with the channel', () => {
    mockGetAlertsForChannelId(id, []).as('getAlertsForChannelIdEmpty');
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyId');
    cy.wait('@getAlertsForChannelIdEmpty');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
    // Verify that the appropriate message is displayed
    cy.get('[data-qa-section="Associated Alerts"]').within(() => {
      cy.findByText(
        'No alerts are associated with this notification channel.Add or assign alerts to start receiving notifications through this channel.'
      ).should('be.visible');
    });
  });

  it('should display error message when API returns an error during fetching notification channel details', () => {
    mockGetAlertChannelByIdError(id).as('getAlertNotificationChannelbyIdError');
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyIdError');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
    // Verify that the appropriate error message is displayed
    cy.findByText(
      'An error occurred while loading the notification channel. Please try again later.'
    ).should('be.visible');
  });

  it('should verify for empty state when overview and details data is missing', () => {
    const incompleteChannelDetails = notificationChannelFactory.build({
      label: '',
      channel_type: 'email',
      created_by: '',
      updated_by: '',
      details: {},
    });
    mockGetAlertChannelById(id, incompleteChannelDetails).as(
      'getAlertNotificationChannelbyIdIncomplete'
    );
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyIdIncomplete');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
  });

  it('should verify notificationChannels with long usernames list wrapping behavior', () => {
    // const longUsernames = Array.from({ length: 20 }, (_, i) => `user${i + 1}`);
    const longUsernames = Array.from(
      { length: 50 },
      (_, i) =>
        `verylongnametestcasecheckwithsplcharsvisibleornotorwrappingup-${i + 1}`
    );
    const longUsernamesChannelDetails = notificationChannelFactory.build({
      label: 'Userlongnamerepeat123456'.repeat(5),
      channel_type: 'email',
      type: 'user',
      details: {
        email: {
          recipient_type: 'user',
          usernames: longUsernames,
        },
      },
      created_by: 'longnamerepeat123456'.repeat(5),
      updated_by: 'longnamerepeat123456'.repeat(5),
      created: '2026-01-27T06:18:00Z',
      updated: new Date().toISOString(),
    });
    mockGetAlertChannelById(id, longUsernamesChannelDetails).as(
      'getAlertNotificationChannelbyIdLongUsernames'
    );

    const largeAlertList = notificationChannelAlertsFactory.buildList(100, {
      service_type: 'nodebalancer',
      label: 'longnamerepeat123456'.repeat(5),
    });

    mockGetAlertsForChannelId(id, largeAlertList).as(
      'getLargeAlertNamesForChannelId'
    );
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyIdLongUsernames');
    cy.wait('@getLargeAlertNamesForChannelId');
    // Verify that the URL is correct
    cy.url().should('include', `/alerts/notification-channels/detail/${id}`);
    // Validate that the long label is displayed correctly
    cy.get('[data-qa-section="Overview"]').within(() => {
      cy.findByText('Name:').should('be.visible');
      cy.findByText(longUsernamesChannelDetails.label).should('be.visible');
    });
    cy.get('[data-qa-section="Details"]').within(() => {
      // Validate that all usernames are displayed correctly without overflow
      longUsernames.forEach((username) => {
        cy.get(`[data-qa-chip="${username}"]`)
          .should('have.text', username)
          .should('be.visible')
          .and(($chip) => {
            // Check that the chip does not overflow its container
            expect($chip[0].scrollWidth).to.be.lessThan(
              $chip[0].clientWidth + 1
            );
          });
      });
    });
  });

  it('should verify clicking on the alert name navigates to the alert detail page', () => {
    cy.wait('@getAlertNotificationChannels');
    // Select the first notification channel to edit
    ui.actionMenu
      .findByTitle('Action menu for Notification Channel ' + label)
      .click();
    ui.actionMenuItem.findByTitle('Show Details').click();
    cy.wait('@getAlertNotificationChannelbyId');
    cy.wait('@getAlertsForChannelId');

    // Click on the first alert name in the Associated Alerts table
    const firstAlert = mockAlerts[0];
    cy.get('[data-qa="associated-alerts-table"]')
      .find('tbody')
      .within(() => {
        cy.get('[data-qa-alert-link="true"]').first().click();
      });

    // Verify that the URL navigates to the correct alert detail page
    cy.url().should(
      'include',
      `/alerts/definitions/detail/${firstAlert.service_type}/${firstAlert.id}`
    );
  });
});
