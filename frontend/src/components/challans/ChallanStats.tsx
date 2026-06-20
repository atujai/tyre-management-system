import { AlertTriangle, CheckCircle, Clock, IndianRupee, ShieldAlert } from 'lucide-react';

export function ChallanStats({ stats }: { stats: any }) {
  const cards = [
    {
      title: 'Total Challans',
      value: stats?.totalChallans || 0,
      icon: <ShieldAlert className="text-blue-500" size={24} />,
      color: 'blue'
    },
    {
      title: 'Pending Fines',
      value: stats?.pendingCount || 0,
      icon: <AlertTriangle className="text-red-500" size={24} />,
      color: 'red',
      subtext: `₹${((stats?.totalAmount || 0) - (stats?.paidAmount || 0)).toLocaleString()}`
    },
    {
      title: 'Overdue (>30 days)',
      value: stats?.overdueCount || 0,
      icon: <Clock className="text-orange-500" size={24} />,
      color: 'orange'
    },
    {
      title: 'Total Amount',
      value: `₹${(stats?.totalAmount || 0).toLocaleString()}`,
      icon: <IndianRupee className="text-green-500" size={24} />,
      color: 'green'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.title} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {card.value}
              </p>
              {card.subtext && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.subtext}</p>
              )}
            </div>
            <div className={`p-3 bg-${card.color}-50 dark:bg-${card.color}-900/20 rounded-lg`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}