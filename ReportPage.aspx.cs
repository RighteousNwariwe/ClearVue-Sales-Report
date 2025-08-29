using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace Prototype_321
{
    public partial class ReportPage : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                // Initialization logic (e.g., load default report type)
            }
        }

        protected void btnGenerate_Click(object sender, EventArgs e)
        {
            // TODO: Fetch data from NoSQL database based on selected type & date range
            // gvReport.DataSource = fetchedData;
            // gvReport.DataBind();
        }

    }
}