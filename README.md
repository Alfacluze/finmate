Overview:-

FinMate is a multi-page financial dashboard web application designed to help users track expenses, manage budgets, and monitor investments in a single interface.
The goal of the application is to provide a clear overview of personal financial health through summarized metrics, visual charts, and categorized transaction tracking.

The Home page presents a complete financial snapshot, including:

1.Available balance after expenses

2.Monthly subscription costs          

3.Total expenses

4.Investment cost basis

5.Category breakdown pie chart

6.Top spending categories

7.Income vs. expenses graph

8.Smart tips section indicating whether the user is within budget


The Expenses page allows users to:

1.View total income (budget), total spent, and remaining balance

2.Add new expenses by category, date, and amount

3.Review a list of recent expenses

4.View spending distribution and summary insights


The Investments page enables users to:

1.Track purchased stocks with live market prices

2.View profit/loss percentages for each holding

3.Maintain a watchlist of potential investments

4.Display a placeholder portfolio comparison chart


Future Extensions:-

FinMate can be extended by:

Connecting to a real database instead of JSON storage

Adding user authentication and secure login

Integrating real financial APIs for live stock and subscription data

Implementing advanced analytics and forecasting

Supporting mobile responsiveness and accessibility improvements


How to use and navigate the Application:- 


FinMate is organized into three primary pages accessible from the top navigation bar:

1.Home

2.Expenses

3.Investments

A profile icon in the top-right corner provides access to account-related options and demonstrates signed-in and signed-out interface states.

Home Page – Financial Overview

The Home page provides a high-level summary of the user’s financial status, including:

1.Available Balance after expenses

2.Monthly Subscriptions total

3.Total Expenses

4.Investment Cost Basis (shares × average cost)

Visual analytics are displayed below the summary:

1.A pie chart showing expense allocation by category

2.A Top Spendings panel listing the highest spending categories

3.An Income vs. Expenses graph illustrating financial trends over time

At the bottom, a Smart Tips section analyzes spending behavior and indicates whether the user is within budget or exceeding limits.


Expenses Page – Budgeting and Tracking

The Expenses page allows users to manage their spending:

1.Displays Total Income (budget), Total Spent, and Remaining Balance

2.Provides a form to add a new expense by:

- Selecting a category

- Entering an amount

- Choosing a date

3.Shows a scrollable list of recent expenses with delete actions

4.Includes:

- A spending-by-category pie chart

- A summary panel describing overall budget status

This page supports continuous tracking and real-time updates to totals.


Investments Page – Portfolio Monitoring

The Investments page enables users to monitor stock activity:

1.Displays a portfolio table containing:

- Ticker symbol

- Purchase price

- Current market price

- Number of shares

- Total value

- Profit/Loss percentage with visual indicators

2.Provides a watchlist for tracking potential investments before purchase

3.Includes a portfolio comparison chart placeholder for future visualization of cost vs. market value

Market values update dynamically to simulate real-time tracking.


Profile Menu Interaction

Clicking the profile icon opens a dropdown interface that demonstrates two states:

1.Signed-out state

- Sign in

- Create account

- Settings

- Help & Support

2.Signed-in state

- Personalized welcome message

- Last login time in Eastern Time (ET)

- Quick-access account actions

- Logout option

Authentication is simulated using local browser storage for demonstration purposes.


Reflection:-

This project provided practical experience in designing and implementing a multi-page web application using Node.js, Express, and static front-end technologies.
A key learning outcome was understanding how client–server interaction works without a database by using structured JSON data and REST-style endpoints.

One of the main challenges involved:

1.Coordinating multiple UI pages while keeping navigation and styling consistent

2.Managing Git branching, pull requests, and team collaboration workflows

3.Implementing dynamic financial visualizations and summaries


Despite these challenges, the project was successful in delivering a fully functional financial dashboard prototype that clearly demonstrates expense tracking, budget monitoring, investment portfolio visualization and multi-page navigation with interactive UI components
Overall, FinMate represents a strong foundation that can be expanded into a complete real-world personal finance management system in future assignments.
