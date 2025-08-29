<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ReportPage.aspx.cs" Inherits="Prototype_321.ReportPage" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Sales Reports - Campus Library Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet" />
    <style type="text/css">
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #edc0bf 0%, #c4caef 100%);
            display: flex;
            flex-direction: column;
        }
        nav {
            position: sticky;
            top: 0;
            background: rgba(50, 50, 90, 0.9);
            padding: 1rem;
            display: flex;
            justify-content: center;
            gap: 2rem;
            z-index: 100;
        }
        nav .nav-btn {
            background: transparent;
            border: none;
            color: white;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: color 0.3s;
        }
        nav .nav-btn:hover {
            color: #ffd700;
        }
        header {
            padding: 3rem 1rem 2rem 1rem;
            text-align: center;
            color: white;
        }
        header h1 {
            font-size: 2.2rem;
            margin-bottom: 0.5rem;
        }
        header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .report-filters {
            background: rgba(255,255,255,0.3);
            margin: 2rem auto;
            padding: 2rem;
            border-radius: 16px;
            max-width: 800px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .report-filters label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
        }
        .report-filters select, .report-filters input[type="date"] {
            width: 100%;
            padding: 0.5rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            border: 1px solid #ccc;
        }
        .action-btn {
            display: inline-block;
            margin-right: 1rem;
            padding: 0.6rem 1.2rem;
            background: rgba(50, 50, 90, 0.8);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.3s, transform 0.2s;
        }
        .action-btn:hover {
            background: rgba(50, 50, 90, 1);
            transform: scale(1.05);
        }
        .report-results {
            margin: 2rem auto;
            max-width: 900px;
            background: rgba(255,255,255,0.3);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">

        

        <header>
            <h1>Sales Reports</h1>
            <p>Generate and export reports based on your desired period</p>
        </header>

        <section class="report-filters">
            <h3>Select Report Parameters</h3>
            <label for="ddlReportType">Report Type</label>
            <asp:DropDownList ID="ddlReportType" runat="server">
                <asp:ListItem>Daily</asp:ListItem>
                <asp:ListItem>Weekly</asp:ListItem>
                <asp:ListItem>Monthly</asp:ListItem>
                <asp:ListItem>Quarterly</asp:ListItem>
                <asp:ListItem>Annual</asp:ListItem>
            </asp:DropDownList>

            <label for="startDate">Start Date</label>
            <asp:TextBox ID="txtStartDate" runat="server" TextMode="Date"></asp:TextBox>

            <label for="endDate">End Date</label>
            <asp:TextBox ID="txtEndDate" runat="server" TextMode="Date"></asp:TextBox>

            <div>
                <asp:Button ID="btnGenerate" runat="server" Text="Generate Report" CssClass="action-btn" OnClick="btnGenerate_Click" />
                
            </div>
        </section>

        <section class="report-results">
            <h3>Report Results</h3>
            <asp:GridView ID="gvReport" runat="server" AutoGenerateColumns="True" GridLines="None" CellPadding="8" />
        </section>

    </form>
</body>
</html>

