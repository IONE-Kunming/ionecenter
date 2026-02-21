import { getTransactions } from "@/lib/actions/finance"
import { TransactionsList } from "@/components/finance/transactions-list"

export default async function TransactionsPage() {
  const transactions = await getTransactions()
  return <TransactionsList transactions={transactions} />
}
