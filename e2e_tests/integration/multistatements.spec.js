/*
 * Copyright (c) 2002-2019 "Neo4j,"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Neo4j is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Cypress, cy, test, expect, before, after */

describe('Multi statements', () => {
  const validQuery = 'RETURN 1; :config; RETURN 2;'

  before(() => {
    cy.visit(Cypress.config('url'))
      .title()
      .should('include', 'Neo4j Browser')
    cy.wait(3000)
    cy.enableMultiStatement()
  })
  after(() => {
    cy.disableMultiStatement()
  })
  it('can connect', () => {
    const password = Cypress.config('password')
    cy.connect('neo4j', password)
  })
  it('can run multiple statements (non open by default)', () => {
    cy.executeCommand(':clear')
    cy.executeCommand(validQuery)
    cy.get('[data-testid="frame"]', { timeout: 10000 }).should('have.length', 1)
    const frame = cy.get('[data-testid="frame"]', { timeout: 10000 }).first()
    frame.get('[data-testid="multi-statement-list"]').should('have.length', 1)
    frame
      .get('[data-testid="multi-statement-list-title"]')
      .should('have.length', 3)
    frame
      .get('[data-testid="multi-statement-list-content"]')
      .should('have.length', 0)
  })

  it('can force run multiple statements to be executed as one statement', () => {
    // Given
    cy.executeCommand(':clear')
    cy.get('[data-testid="drawerSettings"]').click()
    cy.get('[data-testid="enableMultiStatementMode"]').click()
    cy.get('[data-testid="drawerSettings"]').click()

    // When
    cy.executeCommand(validQuery)
    cy.waitForCommandResult()

    // Then
    // Error expected
    cy.get('[data-testid="frameCommand"]', { timeout: 10000 })
      .first()
      .should('contain', validQuery)
    cy.get('[data-testid="frameContents"]', { timeout: 10000 })
      .first()
      .should('contain', 'Error')

    cy.get('[data-testid="drawerSettings"]').click()
    cy.get('[data-testid="enableMultiStatementMode"]').click()
    cy.get('[data-testid="drawerSettings"]').click()
  })

  it('can run multiple statements with error open', () => {
    cy.executeCommand(':clear')
    const query = 'RETURN 1; RETURN $nonsetparam; RETURN 2;'
    cy.executeCommand(query)
    cy.get('[data-testid="frame"]', { timeout: 10000 }).should('have.length', 1)
    const frame = cy.get('[data-testid="frame"]', { timeout: 10000 }).first()
    frame.find('[data-testid="multi-statement-list"]').should('have.length', 1)
    frame
      .get('[data-testid="multi-statement-list-title"]')
      .should('have.length', 3)
    frame
      .get('[data-testid="multi-statement-list-content"]', { timeout: 10000 })
      .should('have.length', 1)
    frame
      .get('[data-testid="multi-statement-list-content"]', { timeout: 10000 })
      .first()
      .should('contain', 'ERROR')
  })
  it('Takes any statements (not just valid cypher and client commands)', () => {
    cy.executeCommand(':clear')
    const query = 'RETURN 1; hello1; RETURN 2; hello2;'
    cy.executeCommand(query)
    cy.get('[data-testid="frame"]', { timeout: 10000 }).should('have.length', 1)
    const frame = cy.get('[data-testid="frame"]', { timeout: 10000 }).first()
    frame.find('[data-testid="multi-statement-list"]').should('have.length', 1)
    frame
      .get('[data-testid="multi-statement-list-title"]')
      .should('have.length', 4)
    frame
      .get('[data-testid="multi-statement-list-content"]', { timeout: 10000 })
      .should('have.length', 1)
    frame
      .get('[data-testid="multi-statement-list-content"]', { timeout: 10000 })
      .first()
      .should('contain', 'ERROR')
  })
  if (Cypress.config('serverVersion') >= 4.0) {
    it('Can use :use command in multi-statements', () => {
      cy.executeCommand(':clear')
      // Create databases
      cy.executeCommand(':use system')
      cy.get('[data-testid="frame"]', { timeout: 10000 }).should(
        'have.length',
        1
      )
      cy.executeCommand('DROP DATABASE test1')
      cy.executeCommand('DROP DATABASE test2')
      cy.get('[data-testid="frame"]', { timeout: 10000 }).should(
        'have.length',
        3
      )
      cy.executeCommand(':clear')

      cy.executeCommand('CREATE DATABASE test1')
      cy.get('[data-testid="frame"]', { timeout: 10000 }).should(
        'have.length',
        1
      )
      cy.executeCommand('CREATE DATABASE test2')
      cy.get('[data-testid="frame"]', { timeout: 10000 }).should(
        'have.length',
        2
      )
      cy.executeCommand(':clear')

      // Time to try it
      const query = ':use test1; CREATE(:Test1); :use test2; CREATE(:Test2);'
      cy.executeCommand(query)
      cy.get('[data-testid="frame"]', { timeout: 10000 }).should(
        'have.length',
        1
      )
      const frame = cy.get('[data-testid="frame"]', { timeout: 10000 }).first()
      frame.get('[data-testid="multi-statement-list"]').should('have.length', 1)
      frame
        .get('[data-testid="multi-statement-list-title"]')
        .should('have.length', 4)
      frame
        .get('[data-testid="multi-statement-list-content"]')
        .should('have.length', 0)

      // Check sidebar for test1
      cy.executeCommand(':use test1')
      cy.get('[data-testid="drawerDBMS"]').click()
      cy.contains('[data-testid="sidebarMetaItem"]', 'Test1', { timeout: 5000 })
      cy.get('[data-testid="drawerDBMS"]').click()

      cy.executeCommand(':use test2')
      cy.get('[data-testid="drawerDBMS"]').click()
      cy.contains('[data-testid="sidebarMetaItem"]', 'Test2', { timeout: 5000 })
      cy.get('[data-testid="drawerDBMS"]').click()

      cy.executeCommand(':use system')
      cy.executeCommand('DROP DATABASE test1')
      cy.executeCommand('DROP DATABASE test2')
    })
  }
})
