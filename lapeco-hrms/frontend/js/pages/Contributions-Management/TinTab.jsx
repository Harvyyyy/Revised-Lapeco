import React from 'react';
import EditableContributionTable from './EditableContributionTable';

const TinTab = (props) => {
  return (
    <div>
      <p className="text-muted">
        This report generates the withholding tax summary required for BIR Form 1601-C.
        <br/>
        <strong>Note:</strong> Tax Withheld values are automatically calculated from payroll data and are read-only.
      </p>
      <EditableContributionTable {...props} />
    </div>
  );
};

export default TinTab;